namespace UserService.Controllers
{
    using System.Security.Claims;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using UserService.Data;
    using UserService.Dto;

    [ApiController]
    [Route("api/[controller]")]
    public class UserProfileController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IConfiguration _configuration;
        public UserProfileController(DataContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // Lấy thông tin profile của người dùng từ token (source of truth)
        [HttpGet("profile")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> UserProfile()
        {
            return Ok(new
            {
                Id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                Username = User.Identity?.Name,
                Email = User.FindFirst("email")?.Value,
                Firstname = User.FindFirst("firstname")?.Value,
                Lastname = User.FindFirst("lastname")?.Value
            });
        }

        // Update thông tin công khai của người dùng (social info)
        [HttpPatch("update-social-information")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> UpdateUserPublicInformation([FromBody] UserUpdateDto userUpdateDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var guidUserId = new Guid(userId);
            if (userId == null)
            {
                return Unauthorized("User not authenticated. Access denied.");
            }

            var user = await _context.IUsers.FindAsync(guidUserId);

            if (user == null)
            {
                return NotFound("User profile not found or an unknown error occurred.");
            }

            user.FirstName = userUpdateDto.FirstName ?? user.FirstName;
            user.LastName = userUpdateDto.LastName ?? user.LastName;
            user.AvatarImage = userUpdateDto.AvatarImage ?? user.AvatarImage;
            user.CoverImage = userUpdateDto.CoverImage ?? user.CoverImage;
            user.Bio = userUpdateDto.Bio ?? user.Bio;
            user.CurrentCity = userUpdateDto.CurrentCity ?? user.CurrentCity;
            user.Hometown = userUpdateDto.Hometown ?? user.Hometown;
            user.Workplace = userUpdateDto.Workplace ?? user.Workplace;
            user.Education = userUpdateDto.Education ?? user.Education;
            user.Gender = userUpdateDto.Gender ?? user.Gender;
            user.RelationshipStatus = userUpdateDto.RelationshipStatus ?? user.RelationshipStatus;
            user.FavoriteCharacter = userUpdateDto.FavoriteCharacter ?? user.FavoriteCharacter;
            user.DateOfBirth = userUpdateDto.DateOfBirth ?? user.DateOfBirth;

            _context.IUsers.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật thông tin social cho: "  + user.Username + " thành công.",
                // data = new
                // {
                //     Id = user.Id,
                //     Firstname = user.FirstName,
                //     Lastname = user.LastName,
                //     AvatarImage = user.AvatarImage,
                //     CoverImage = user.CoverImage
                // }
            });
        }

    }
}