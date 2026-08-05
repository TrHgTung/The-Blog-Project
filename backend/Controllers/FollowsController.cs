using System.Security.Claims;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    /// <summary>
    /// Description: Quản lý tính năng theo dõi giữa các người dùng
    /// Author: tungth
    /// Create Date: 15-01-2026
    /// </summary>
    public class FollowsController : ControllerBase
    {
        private readonly DataContext _context;

        public FollowsController(DataContext context)
        {
            _context = context;
        }

        /// Theo dõi một người dùng khác theo followingId (không cho phép tự follow chính mình)
        /// Endpoint: POST api/follows/{followingId}
        [HttpPost("{followingId}")]
        public async Task<IActionResult> Follow(Guid followingId)
        {
            var followerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            if (followerId == followingId) return BadRequest("You cannot follow yourself");

            var followingUser = await _context.Users.FindAsync(followingId);
            if (followingUser == null) return NotFound();

            var follow = await _context.Follows.FindAsync(followerId, followingId);
            if (follow != null) return BadRequest("You are already following this user");

            follow = new Follow
            {
                FollowerId = followerId,
                FollowingId = followingId
            };

            _context.Follows.Add(follow);
            await _context.SaveChangesAsync();

            return Ok();
        }

        /// Hủy theo dõi một người dùng theo followingId
        /// Endpoint: DELETE api/follows/{followingId}
        [HttpDelete("{followingId}")]
        public async Task<IActionResult> Unfollow(Guid followingId)
        {
            var followerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var follow = await _context.Follows.FindAsync(followerId, followingId);
            if (follow == null) return NotFound();

            _context.Follows.Remove(follow);
            await _context.SaveChangesAsync();

            return Ok();
        }

        /// Lấy danh sách những người đang theo dõi một user (followers) - cho phép truy cập ẩn danh
        /// Endpoint: GET api/follows/followers/{userId}
        [HttpGet("followers/{userId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFollowers(Guid userId)
        {
            var followers = await _context.Follows
                .Where(f => f.FollowingId == userId)
                .Select(f => new
                {
                    f.Follower.Id,
                    f.Follower.Username,
                    f.Follower.DisplayName,
                    f.Follower.ProfilePicture,
                    f.Follower.cartoonCharacter
                })
                .ToListAsync();

            return Ok(followers);
        }

        /// Lấy danh sách những người mà một user đang theo dõi (following) - cho phép truy cập ẩn danh
        /// Endpoint: GET api/follows/following/{userId}
        [HttpGet("following/{userId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFollowing(Guid userId)
        {
            var following = await _context.Follows
                .Where(f => f.FollowerId == userId)
                .Select(f => new
                {
                    f.Following.Id,
                    f.Following.Username,
                    f.Following.DisplayName,
                    f.Following.ProfilePicture,
                    f.Following.cartoonCharacter
                })
                .ToListAsync();

            return Ok(following);
        }
    }
}
