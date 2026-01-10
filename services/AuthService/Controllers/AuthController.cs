using AuthService.Dto;
using Microsoft.AspNetCore.Mvc;
using AuthService.Models;
using AuthService.Data;
using Microsoft.EntityFrameworkCore;
using System.Text;
using BCrypt.Net;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AuthService.Helper;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/auth-service/[controller]")]

    public class AuthController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IConfiguration _configuration;
        public AuthController(DataContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> UserLogin([FromBody] UserLoginDto userLoginDto)
        {
            // check user exists or not
            var userCount = await _context.Users.CountAsync();
            if (userCount < 1)
            {
                return BadRequest(new
                {
                    message = "Chưa có user nào tồn tại, vui lòng đăng ký tài khoản trước"
                });
            }
            var user = await _context.Users
                .FirstOrDefaultAsync(a => a.Username == userLoginDto.Username);

            if (user == null || !BCrypt.Net.BCrypt.Verify(userLoginDto.Password, user.Password))
            {
                return Unauthorized(new
                {
                    message = "Sai thông tin đăng nhập"
                });
            }

            // Generate JWT token logic
            // var tokenGenerated = CreateToken.DeprecateGenerateToken(user.Id, user.Username, _configuration); // old func
            var tokenGenerated = TokenHelper.GenerateToken(user, _configuration);

            // lưu refresh token vào db
            _context.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id,
                Token = tokenGenerated.RefreshToken,
                ExpiresAt = tokenGenerated.RefreshTokenExpiresAt
            });
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đăng nhập thành công cho:" + user.Username,
                token = tokenGenerated,
            });

        }

        [HttpPost("register")]
        public IActionResult UserRegister([FromBody] UserRegisterDto userRegisterDto)
        {
            var existingUser = _context.Users
                .FirstOrDefault(a => a.Username == userRegisterDto.Username);

            if (existingUser != null)
            {
                return BadRequest(new
                {
                    message = "Tên đăng nhập đã tồn tại"
                });
            }

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(userRegisterDto.Password);

            var newUser = new User
            {
                Id = Guid.NewGuid(),
                Username = userRegisterDto.Username,
                Password = hashedPassword,
                Email = userRegisterDto.Email,
                Firstname = userRegisterDto.FirstName,
                Lastname = userRegisterDto.LastName,
                AvatarImage = userRegisterDto.AvatarImage,
                CoverImage = userRegisterDto.CoverImage,
            };

            _context.Users.Add(newUser);
            _context.SaveChanges();

            return Ok(new
            {
                message = "Đăng ký thành công cho profile: " + newUser.Username,
            });
        }

        [HttpGet("profile")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> UserProfile()
        {
            var userCount = await _context.Users.CountAsync();
            if (userCount < 1)
            {
                return BadRequest(new
                {
                    message = "Chưa có user nào tồn tại."
                });
            }
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var guidUserId = new Guid(userId);
            if (userId == null)
            {
                return Unauthorized("User not authenticated.");
            }

            var user = _context.Users.Find(guidUserId);

            if (user == null)
            {
                return NotFound("User not found. Unauthorized access.");
            }

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.Firstname,
                user.Lastname,
                user.AvatarImage,
                user.CoverImage
            });
        }

        [HttpPatch("update-user/{id}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> UpdateUserInformation(Guid id, [FromBody] UserUpdateDto userUpdateDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var guidUserId = new Guid(userId);
            if (userId == null)
            {
                return Unauthorized("User not authenticated. Access denied.");
            }

            var user = await _context.Users.FindAsync(guidUserId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            user.Firstname = userUpdateDto.FirstName ?? user.Firstname;
            user.Lastname = userUpdateDto.LastName ?? user.Lastname;
            user.AvatarImage = userUpdateDto.AvatarImage ?? user.AvatarImage;
            user.CoverImage = userUpdateDto.CoverImage ?? user.CoverImage;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật thông tin người dùng thành công.",
                data = new
                {
                    Id = user.Id,
                    Firstname = user.Firstname,
                    Lastname = user.Lastname,
                    AvatarImage = user.AvatarImage,
                    CoverImage = user.CoverImage
                }
            });
        }

        [HttpPatch("change-password/{id}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> ChangeUserPassword(Guid id, [FromBody] ChangePasswordDto changePasswordDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var guidUserId = new Guid(userId);
            var user = await _context.Users.FindAsync(guidUserId);

            var newUserPassword = changePasswordDto.NewUserPassword;

            if (userId == null || user == null)
            {
                return Unauthorized("User not authenticated. Access denied.");
            }

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(newUserPassword);
            user.Password = hashedPassword;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đổi mật khẩu thành công cho user: " + user.Username,
            });
        }

    }
}