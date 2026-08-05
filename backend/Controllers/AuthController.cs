using backend.Data;
using backend.Data.DTOs;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.Extensions.Caching.Distributed;
using backend.Utilities;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    /// <summary>
    /// Description: Quản lý xác thực và phân quyền người dùng
    /// Author: tungth
    /// Create Date: 30-12-2025
    /// pending project due to confirmation by chairman/big-boss
    /// </summary>
    public class AuthController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IAuthService _authService;
        private readonly ICaptchaService _captchaService;
        private readonly IEmailService _emailService;
        private readonly IDistributedCache _cache;
        private readonly ILogger<AuthController> _logger;

        public AuthController(DataContext context, IAuthService authService, ICaptchaService captchaService, IEmailService emailService, IDistributedCache cache, ILogger<AuthController> logger)
        {
            _context = context;
            _authService = authService;
            _captchaService = captchaService;
            _emailService = emailService;
            _cache = cache;
            _logger = logger;
        }

        private string GenerateVerificationCode()
        {
            return new Random().Next(100000, 999999).ToString();
        }

        /// Làm mới access token bằng refresh token cookie, tạo cặp token mới và thu hồi token cũ
        /// Endpoint: POST api/auth/refresh-token
        [HttpPost("refresh-token")]
        public async Task<ActionResult<UserDto>> RefreshToken()
        {
            var refreshTokenCookie = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshTokenCookie))
                return Unauthorized("Phiên làm việc không tồn tại.");

            User? user = null;

            // [B] Try Redis cache first for fast userId resolution
            try
            {
                var cachedUserId = await _cache.GetStringAsync($"rt:{refreshTokenCookie}");
                if (cachedUserId != null && Guid.TryParse(cachedUserId, out var uid))
                    user = await _context.Users.FindAsync(uid);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis unavailable for refresh token lookup, falling back to DB.");
            }

            // [D] Query directly from RefreshTokens table (indexed on Token)
            // instead of scanning through Users → Include → RefreshTokens.Any()
            var ownedToken = await _context.RefreshTokens
                .Include(t => t.User)
                .Include(t => t.LoginSession)
                .FirstOrDefaultAsync(t => t.Token == refreshTokenCookie);

            if (ownedToken == null) return Unauthorized("Phiên làm việc không tồn tại.");

            user ??= ownedToken.User;
            if (user == null) return Unauthorized("Phiên làm việc không tồn tại.");

            if (ownedToken.ExpiredAt < DateTime.UtcNow || ownedToken.RevokedAt != null) 
                return Unauthorized("Phiên đã bị thu hồi hoặc hết hạn.");
            
            if (ownedToken.LoginSession?.RevokedAt != null)
                return Unauthorized("Phiên đăng nhập này đã bị đăng xuất từ xa.");

            // Generate new token pair
            var newRefreshToken = _authService.GenerateRefreshToken();
            newRefreshToken.UserId = user.Id;
            newRefreshToken.LoginSessionId = ownedToken.LoginSessionId;
            
            // Revoke old token
            ownedToken.RevokedAt = DateTime.UtcNow;
            
            _context.RefreshTokens.Add(newRefreshToken);
            
            // Update session if it exists
            if (ownedToken.LoginSession != null)
                ownedToken.LoginSession.RefreshTokenValue = newRefreshToken.Token;
            
            await _context.SaveChangesAsync();

            // [B] Update Redis: remove old token, cache new token
            try
            {
                await _cache.RemoveAsync($"rt:{refreshTokenCookie}");
                await _cache.SetStringAsync($"rt:{newRefreshToken.Token}", user.Id.ToString(),
                    new DistributedCacheEntryOptions { AbsoluteExpiration = newRefreshToken.ExpiredAt });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update Redis cache for refresh token.");
            }

            SetRefreshToken(newRefreshToken);

            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                DisplayName = user.DisplayName,
                IsAdmin = user.IsAdmin,
                ProfilePicture = user.ProfilePicture,
                Bio = user.Bio,
                cartoonCharacter = user.cartoonCharacter,
                DateOfBirth = user.DateOfBirth,
                SessionId = ownedToken.LoginSession?.SessionSecret,
                Token = _authService.CreateToken(user, ownedToken.LoginSession?.SessionSecret ?? "")
            };
        }

        /// Đăng ký tài khoản mới, xác thực CAPTCHA, gửi email xác minh mã OTP
        /// Endpoint: POST api/auth/register
        [Idempotent]
        [HttpPost("register")]
        public async Task<ActionResult<UserDto>> Register(UserRegisterDto registerDto)
        {
            try 
            {
                // --- Server-side CAPTCHA verification ---
                var captchaValid = await _captchaService.VerifyAsync(registerDto.CaptchaToken);
                if (!captchaValid)
                    return BadRequest("CAPTCHA verification failed. Please try again.");

                if (await _context.Users.AnyAsync(x => x.Username == registerDto.Username.ToLower()))
                {
                    return BadRequest("Username is taken");
                }
                
                if (await _context.Users.AnyAsync(x => x.Email == registerDto.Email.ToLower()))
                {
                    return BadRequest("Email is already registered");
                }

                var verificationCode = GenerateVerificationCode();

                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Username = registerDto.Username.ToLower(),
                    Email = registerDto.Email.ToLower(),
                    DisplayName = registerDto.DisplayName,
                    Password = _authService.HashPassword(registerDto.Password),
                    cartoonCharacter = Random.Shared.Next(1, 151).ToString(),
                    IsEmailVerified = false,
                    VerificationCode = verificationCode,
                    VerificationCodeExpiry = DateTime.UtcNow.AddMinutes(15),
                    VerificationCodeAttempts = 0
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                
                // Send verification email
                var emailSubject = "BlogSocial - Xác minh thao tác đăng ký tài khoản của bạn";
                var emailBody = $@"
                    <h2>Hân hoan bạn đến với Blog Social</h2>
                    <p>Mã xác minh của bạn là: <strong>{verificationCode}</strong></p>
                    <p>Mã này sẽ hết hạn sau 15 phút.</p>
                ";
                await _emailService.SendEmailAsync(user.Email, emailSubject, emailBody);

                return Ok(new 
                { 
                    message = "Đăng ký thành công", 
                    email = user.Email 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("REGISTER ERROR: " + ex.Message);
                Console.WriteLine("STACK TRACE: " + ex.StackTrace);
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        /// Đăng nhập tài khoản, xác thực CAPTCHA, tạo phiên đăng nhập (LoginSession) và cặp token
        /// Endpoint: POST api/auth/login
        [Idempotent]
        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login(UserLoginDto loginDto)
        {
            // --- Server-side CAPTCHA verification ---
            var captchaValid = await _captchaService.VerifyAsync(loginDto.CaptchaToken);
            if (!captchaValid)
                return BadRequest("CAPTCHA verification failed. Please try again.");

            // [D] Removed unnecessary .Include(u => u.RefreshTokens)
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Username == loginDto.Username.ToLower());

            if (user == null || !_authService.VerifyPassword(loginDto.Password, user.Password))
            {
                return Unauthorized("Tên đăng nhập hoặc mật khẩu không chính xác");
            }

            if (!user.IsEmailVerified)
            {
                return StatusCode(403, "Email chưa được xác minh. Vui lòng xác minh email trước.");
            }

            var refreshToken = _authService.GenerateRefreshToken();
            
            // Create a NEW Login Session
            var loginSession = new LoginSession
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                SessionSecret = Guid.NewGuid().ToString("N"), // Mật khẩu phiên ngẫu nhiên
                RefreshTokenValue = refreshToken.Token
            };
            _context.LoginSessions.Add(loginSession);
            
            // Link refresh token to this session
            refreshToken.LoginSessionId = loginSession.Id;
            refreshToken.UserId = user.Id;
            _context.RefreshTokens.Add(refreshToken);
            
            await _context.SaveChangesAsync();

            // [B] Cache refresh token in Redis for fast lookup
            try
            {
                await _cache.SetStringAsync($"rt:{refreshToken.Token}", user.Id.ToString(),
                    new DistributedCacheEntryOptions { AbsoluteExpiration = refreshToken.ExpiredAt });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cache refresh token in Redis.");
            }

            SetRefreshToken(refreshToken);

            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                DisplayName = user.DisplayName,
                IsAdmin = user.IsAdmin,
                ProfilePicture = user.ProfilePicture,
                Bio = user.Bio,
                cartoonCharacter = user.cartoonCharacter,
                DateOfBirth = user.DateOfBirth,
                SessionId = loginSession.SessionSecret, // Trả về cho frontend lưu
                Token = _authService.CreateToken(user, loginSession.SessionSecret)
            };
        }

        /// Đăng xuất khỏi thiết bị hiện tại, thu hồi refresh token và xóa cookie
        /// Endpoint: POST api/auth/logout
        [Authorize]
        [HttpPost("logout")]
        public async Task<ActionResult> Logout()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (!string.IsNullOrEmpty(refreshToken))
            {
                // [D] Query directly from RefreshTokens (indexed on Token)
                var token = await _context.RefreshTokens
                    .FirstOrDefaultAsync(t => t.Token == refreshToken);

                if (token != null)
                {
                    token.RevokedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                // [B] Remove from Redis cache
                try { await _cache.RemoveAsync($"rt:{refreshToken}"); }
                catch (Exception ex) { _logger.LogWarning(ex, "Failed to remove refresh token from Redis."); }
            }

            Response.Cookies.Delete("refreshToken");
            return Ok();
        }

        /// Đăng xuất khỏi tất cả các thiết bị khác (remote logout), giữ nguyên phiên hiện tại
        /// Endpoint: POST api/auth/logout-other-devices
        [Authorize]
        [HttpPost("logout-other-devices")]
        public async Task<ActionResult> LogoutOtherDevices()
        {
            var userStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var currentSessionSecret = User.FindFirstValue(ClaimTypes.Sid);
            
            if (string.IsNullOrEmpty(userStr)) return Unauthorized();
            
            var userId = Guid.Parse(userStr);

            // 1. Thu hồi tất cả LoginSession của user này trừ session hiện tại
            var otherSessions = await _context.LoginSessions
                .Where(s => s.UserId == userId && s.RevokedAt == null && s.SessionSecret != currentSessionSecret)
                .ToListAsync();

            foreach (var session in otherSessions)
            {
                session.RevokedAt = DateTime.UtcNow;
            }

            // 2. Thu hồi tất cả RefreshToken tương ứng (nếu cần thiết để triệt để)
            var otherRefreshTokens = await _context.RefreshTokens
                .Where(t => t.UserId == userId && t.RevokedAt == null && t.LoginSession.SessionSecret != currentSessionSecret)
                .ToListAsync();

            foreach (var token in otherRefreshTokens)
            {
                token.RevokedAt = DateTime.UtcNow;
                // [B] Remove revoked tokens from Redis
                try { await _cache.RemoveAsync($"rt:{token.Token}"); }
                catch { /* Best effort cleanup */ }
            }
            
            // 3. (Optional) Dùng TokenRevokedBefore như một lớp bảo mật global cho user
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                // user.TokenRevokedBefore = DateTime.UtcNow; // Nếu set cái này thì phiên hiện tại cũng die trừ khi cấp token mớii
            }

            await _context.SaveChangesAsync();
            
            return Ok(new { 
                message = "Đã đăng xuất thành công khỏi các thiết bị khác."
            });
        }

        /// Xác minh email bằng mã OTP sau khi đăng ký, hỗ trợ tìm kiếm theo email hoặc mã xác nhận
        /// Endpoint: POST api/auth/verify-email
        [Idempotent]
        [HttpPost("verify-email")]
        public async Task<ActionResult> VerifyEmail(VerifyEmailDto verifyDto)
        {
            User? user = null;

            if (!string.IsNullOrEmpty(verifyDto.Email))
            {
                user = await _context.Users.FirstOrDefaultAsync(u => u.Email == verifyDto.Email.ToLower());
            }
            else if (!string.IsNullOrEmpty(verifyDto.VerificationCode))
            {
                // Tìm kiếm user dựa trên mã xác nhận (Trường hợp UX tối ưu: không bắt nhập email)
                var usersWithCode = await _context.Users
                    .Where(u => u.VerificationCode == verifyDto.VerificationCode && u.IsEmailVerified == false)
                    .ToListAsync();

                if (usersWithCode.Count > 1) 
                    return BadRequest("Phát hiện nhiều tài khoản trùng mã. Vui lòng cung cấp cả Email để xác minh chính xác.");
                
                user = usersWithCode.FirstOrDefault();
            }

            if (user == null) return BadRequest("Không tìm thấy tài khoản hoặc mã không hợp lệ.");

            if (user.IsEmailVerified) return BadRequest("Email đã được xác minh trước đó.");

            if (user.VerificationCodeExpiry < DateTime.UtcNow)
                return BadRequest("Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới.");

            if (user.VerificationCodeAttempts >= 5)
                return BadRequest("Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.");

            if (user.VerificationCode != verifyDto.VerificationCode)
            {
                user.VerificationCodeAttempts++;
                await _context.SaveChangesAsync();
                return BadRequest($"Mã xác minh không chính xác. Bạn còn {5 - user.VerificationCodeAttempts} lần thử.");
            }

            user.IsEmailVerified = true;
            user.VerificationCode = null;
            user.VerificationCodeExpiry = null;
            user.VerificationCodeAttempts = 0;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xác minh thành công! Chào mừng bạn tham gia mạng xã hội." });
        }

        /// Gửi mã xác minh qua email để khôi phục mật khẩu (quên mật khẩu)
        /// Endpoint: POST api/auth/forgot-password
        [Idempotent]
        [HttpPost("forgot-password")]
        public async Task<ActionResult> ForgotPassword(ForgotPasswordDto forgotDto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == forgotDto.Email.ToLower());
            if (user == null) return Ok(new { message = "Nếu email tồn tại, mã xác minh sẽ được gửi." }); // Security best practice

            var verificationCode = GenerateVerificationCode();
            user.VerificationCode = verificationCode;
            user.VerificationCodeExpiry = DateTime.UtcNow.AddMinutes(15);
            user.VerificationCodeAttempts = 0;
            await _context.SaveChangesAsync();

            var emailSubject = "BlogSocial - Khôi phục mật khẩu của bạn";
            var emailBody = $@"
                <h2>Khôi phục mật khẩu của bạn</h2>
                <p>Mã xác minh của bạn là: <strong>{verificationCode}</strong></p>
                <p>Mã này sẽ hết hạn sau 15 phút.</p>
                <p>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
            ";
            await _emailService.SendEmailAsync(user.Email, emailSubject, emailBody);

            return Ok(new { message = "If the email exists, a verification code will be sent." });
        }

        /// Xác minh mã OTP trước khi cho phép đặt lại mật khẩu
        /// Endpoint: POST api/auth/verify-reset-password
        [Idempotent]
        [HttpPost("verify-reset-password")]
        public async Task<ActionResult> VerifyResetPassword(VerifyResetPasswordDto verifyDto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == verifyDto.Email.ToLower());
            if (user == null) return BadRequest("Yêu cầu không hợp lệ.");

            if (user.VerificationCodeExpiry < DateTime.UtcNow)
                return BadRequest("Mã xác minh đã hết hạn.");

            if (user.VerificationCodeAttempts >= 5)
                return BadRequest("Số lần thử đã vượt quá giới hạn. Vui lòng yêu cầu mã mới.");

            if (user.VerificationCode != verifyDto.VerificationCode)
            {
                user.VerificationCodeAttempts++;
                await _context.SaveChangesAsync();
                return BadRequest($"Mã xác minh không hợp lệ. Bạn còn {5 - user.VerificationCodeAttempts} lần thử.");
            }

            // If we are just verifying, we can just return success and let the next step reset
            return Ok(new { message = "Mã xác minh đã được xác minh, bạn có thể đặt lại mật khẩu." });
        }

        /// Đặt lại mật khẩu mới sau khi đã xác minh mã OTP, thu hồi toàn bộ phiên đăng nhập cũ
        /// Endpoint: POST api/auth/reset-password
        [Idempotent]
        [HttpPost("reset-password")]
        public async Task<ActionResult> ResetPassword(ResetPasswordDto resetDto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == resetDto.Email.ToLower());
            if (user == null) return BadRequest("Yêu cầu không hợp lệ.");

            if (user.VerificationCodeExpiry < DateTime.UtcNow)
                return BadRequest("Mã xác minh đã hết hạn.");

            if (user.VerificationCodeAttempts >= 5)
                return BadRequest("Số lần thử đã vượt quá giới hạn. Vui lòng yêu cầu mã mới.");

            if (user.VerificationCode != resetDto.VerificationCode)
            {
                user.VerificationCodeAttempts++;
                await _context.SaveChangesAsync();
                return BadRequest("Mã xác minh không hợp lệ.");
            }

            user.Password = _authService.HashPassword(resetDto.NewPassword);
            user.VerificationCode = null;
            user.VerificationCodeExpiry = null;
            user.VerificationCodeAttempts = 0;
            
            // Invalidate all existing refresh tokens
            var activeTokens = await _context.RefreshTokens.Where(t => t.UserId == user.Id && t.RevokedAt == null).ToListAsync();
            foreach (var token in activeTokens)
            {
                token.RevokedAt = DateTime.UtcNow;
                // [B] Remove revoked tokens from Redis
                try { await _cache.RemoveAsync($"rt:{token.Token}"); }
                catch { /* Best effort cleanup */ }
            }

            // Invalidate all active Login Sessions
            var activeSessions = await _context.LoginSessions.Where(s => s.UserId == user.Id && s.RevokedAt == null).ToListAsync();
            foreach (var session in activeSessions)
            {
                session.RevokedAt = DateTime.UtcNow;
            }

            // (Optional redundant layer) Immediately invalidate all current access tokens via global timestamp
            user.TokenRevokedBefore = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập." });
        }

        private void SetRefreshToken(RefreshToken refreshToken)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = refreshToken.ExpiredAt,
                SameSite = SameSiteMode.Strict,
                Secure = false // set to false if not using HTTPS
            };
            Response.Cookies.Append("refreshToken", refreshToken.Token, cookieOptions);
        }
    }
}
