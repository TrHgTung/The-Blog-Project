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
            var tokenGenerated = CreateToken.GenerateToken(user.Id, user.Username, _configuration);

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
        public IActionResult UserProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var guidUserId = new Guid(userId);
            if (userId == null)
            {
                return Unauthorized("User not authenticated.");
            }

            var user = _context.Users.Find(guidUserId);

            if (user == null)
            {
                return NotFound("User not found.");
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

    }
}