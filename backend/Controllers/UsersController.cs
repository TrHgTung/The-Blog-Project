using System.Security.Claims;
using backend.Data;
using backend.Data.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    /// <summary>
    /// Description: Quản lý thông tin và hồ sơ người dùng
    /// Author: tungth
    /// Create Date: 12-01-2026
    /// </summary>
    public class UsersController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IDistributedCache _cache;
        private readonly ILogger<UsersController> _logger;

        public UsersController(DataContext context, IDistributedCache cache, ILogger<UsersController> logger)
        {
            _context = context;
            _cache = cache;
            _logger = logger;
        }

        /// Lấy thông tin hồ sơ người dùng theo Id, có cache Redis 10 phút (cho phép truy cập ẩn danh)
        /// Endpoint: GET api/users/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<UserDto>> GetUser(Guid id)
        {
            string cacheKey = $"user_profile_{id}";
            try
            {
                var cachedUser = await _cache.GetStringAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedUser))
                {
                    return Ok(System.Text.Json.JsonSerializer.Deserialize<UserDto>(cachedUser));
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis is unavailable. Falling back to database for GetUser.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound();

            var userDto = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                DisplayName = user.DisplayName,
                ProfilePicture = user.ProfilePicture,
                Bio = user.Bio,
                IsAdmin = user.IsAdmin,
                cartoonCharacter = user.cartoonCharacter ?? "1",
                DateOfBirth = user.DateOfBirth
            };

            try
            {
                // Cache for 10 minutes
                var cacheOptions = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
                };
                await _cache.SetStringAsync(cacheKey, System.Text.Json.JsonSerializer.Serialize(userDto), cacheOptions);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to set Redis cache for user {UserId}", id);
            }

            return userDto;
        }

        /// Cập nhật hồ sơ cá nhân (tên hiển thị, ảnh đại diện, bio, Pokémon, ngày sinh) và xóa cache cũ
        /// Endpoint: PUT api/users/profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile(UserUpdateDto updateDto)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users.FindAsync(userId);

            if (user == null) return NotFound();

            user.DisplayName = updateDto.DisplayName;
            user.ProfilePicture = updateDto.ProfilePicture;
            user.Bio = updateDto.Bio;
            
            if (!string.IsNullOrEmpty(updateDto.cartoonCharacter))
            {
                user.cartoonCharacter = updateDto.cartoonCharacter;
            }

            user.DateOfBirth = updateDto.DateOfBirth;

            await _context.SaveChangesAsync();

            // Invalidate cache
            try
            {
                await _cache.RemoveAsync($"user_profile_{userId}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to remove Redis cache for user {UserId}", userId);
            }

            return Ok(new 
            {
                user.DisplayName,
                user.ProfilePicture,
                user.Bio,
                user.cartoonCharacter,
                user.DateOfBirth
            });
        }
    }
}
