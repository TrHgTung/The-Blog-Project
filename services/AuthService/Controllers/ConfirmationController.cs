using Microsoft.AspNetCore.Mvc;
using AuthService.Data;
using AuthService.Dto;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using AuthService.Helper.EmailSender;
using AuthService.Models;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/auth-service/[controller]")]
    public class ConfirmationController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly DataContext _context;
        private readonly IEmailSender _emailSender;
        public ConfirmationController(IConfiguration configuration, DataContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        [HttpPost("send-confirmation-code-for-account-registration")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> ConfirmAccountRegistration()
        {
            var checkUserInactiveOrNot = await _context.Users.Where(u => u.AccountStatus == "0")
                .FirstOrDefaultAsync(u => u.Id.ToString() == ClaimTypes.NameIdentifier);
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var getCurrentUser = await _context.Users.FindAsync(Guid.Parse(getCurrentUserId.ToString()));

            if (checkUserInactiveOrNot != null)
            {
                return BadRequest(new
                {
                    message = "Your account has been activated"
                });
            }

            var createCode = Random.Shared.Next(100000, 999999).ToString() + getCurrentUserId.ToString();

            // gửi mail mã xác thực với user khi đăng ký tài khoản mới
            var subjectMail = "Mã xác thực tài khoản";
            var bodyMail = $@"
                <h3>Xin chào {getCurrentUser.Username},</h3>
                <p>Bạn vừa yêu cầu xác thực tài khoản.</p>
                <p>Mã xác thực của bạn là:</p>
                <h2 style='color:#4CAF50'>{createCode}</h2>
                <p>Mã này sẽ hết hạn sau 5 phút.</p>
            ";
            // Gửi email
            await _emailSender.SendEmailAsync(getCurrentUser.Email, subjectMail, bodyMail);

            // Lưu mã xác thực vào cơ sở dữ liệu
            var verifyCode = new VerifyCode
            {
                UserId = Guid.Parse(getCurrentUserId.ToString()),
                Code = createCode,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5), // Mã hết hạn sau 5 phút
            };

            _context.VerifyCodes.Add(verifyCode);

            return Ok(new
            {
                message = "Verification code sent to user email: " + getCurrentUser.Email,
            });
        }

        [HttpPatch("verify-account-registration-code")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> VerifyAccountRegistrationCode([FromBody] VerifyAccountRegCodeDto verifyAccountRegCodeDto)
        {
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null)
            {
                return Unauthorized();
            }
            var getCurrentUser = await _context.Users.FindAsync(Guid.Parse(getCurrentUserId.ToString()));

            var storedCode = await _context.VerifyCodes
                .Where(vc => vc.UserId.ToString() == getCurrentUserId && vc.UsedAt == null)
                .FirstOrDefaultAsync(vc => vc.Code == verifyAccountRegCodeDto.UserCode);

            if (storedCode == null)
            {
                return BadRequest(new
                {
                    message = "Mã xác thực không hợp lệ hoặc đã hết hạn"
                });
            }

            getCurrentUser.AccountStatus = "1"; // update status (this account has been activated)
            _context.Users.Update(getCurrentUser);

            // Đánh dấu mã xác thực đã được sử dụng
            storedCode.UsedAt = DateTime.UtcNow;
            _context.VerifyCodes.Update(storedCode);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tài khoản của bạn đã được kích hoạt thành công"
            });
        }

    }
}
