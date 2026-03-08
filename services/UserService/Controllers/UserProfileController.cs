using Microsoft.AspNetCore.Mvc;
using UserService.Data;
using UserService.Dto;
using UserService.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using UserService.Model;

namespace UserService.Controllers
{
    [ApiController]
    [Route("api/user-service/[controller]")]
    public class UserProfileController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IConfiguration _configuration;
        private readonly IRedisCacheService _cacheService;

        public UserProfileController(DataContext context, IConfiguration configuration, IRedisCacheService cacheService)
        {
            _context = context;
            _configuration = configuration;
            _cacheService = cacheService;
        }

        // Lấy thông tin public social profile của người dùng
        [HttpGet("profile")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> UserProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var cacheKey = $"user_profile_{userId}";
            var cachedProfile = await _cacheService.GetAsync<object>(cacheKey);

            if (cachedProfile != null)
            {
                return Ok(cachedProfile);
            }

            var profile = new
            {
                Id = userId,
                Username = User.Identity?.Name,
                Email = User.FindFirst("email")?.Value,
                Firstname = User.FindFirst("firstname")?.Value,
                Lastname = User.FindFirst("lastname")?.Value
            };

            await _cacheService.SetAsync(cacheKey, profile, TimeSpan.FromHours(1));

            return Ok(profile);
        }

        // Update thông tin công khai của người dùng (social info)
        [HttpPatch("update-social-information")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> UpdateUserPublicInformation([FromBody] UserUpdateDto userUpdateDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userId == null)
            {
                return Unauthorized("User not authenticated. Access denied.");
            }
            var guidUserId = Guid.Parse(userId);
            var user = await _context.UPSInfo.FindAsync(guidUserId);

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

            _context.UPSInfo.Update(user);
            await _context.SaveChangesAsync();

            // Invalidate cache
            await _cacheService.RemoveAsync($"user_profile_{userId}");

            return Ok(new
            {
                message = "Cập nhật thông tin social cho: " + user.Username + " thành công.",
            });
        }
        
        [HttpGet("public-profile/{userId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> GetPublicProfile(Guid userId)
        {
            var currentUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserIdStr == null) return Unauthorized();
            var currentUserId = Guid.Parse(currentUserIdStr);

            var targetUser = await _context.UPSInfo.FirstOrDefaultAsync(u => u.UserId == userId);
            if (targetUser == null) return NotFound("User not found.");

            var followStatus = await _context.UFStatus.FirstOrDefaultAsync(uf => 
                (uf.UserIdA == currentUserId && uf.UserIdB == userId) || (uf.UserIdB == currentUserId && uf.UserIdA == userId));

            return Ok(new
            {
                Id = targetUser.UserId,
                targetUser.Username,
                targetUser.FirstName,
                targetUser.LastName,
                targetUser.AvatarImage,
                targetUser.Bio,
                IsFollowing = followStatus?.IsFollowing ?? false,
                IsBlocked = followStatus?.IsBlocked ?? false
            });
        }

    }
}