using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UserService.Model;

namespace UserService.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class UserRecommendationController : ControllerBase
    {
        private readonly DataContext _context;
        
        public UserRecommendationController(DataContext context)
        {
            _context = context;
        }

        [HttpGet("recommendations")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> GetUserRecommendations_AddFriend()
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            // Lấy danh sách người dùng đã theo dõi
            var getFollowerList_byCurrentUser = await _context.URFlags
                .Where(uf => uf.UserId.ToString() == currentUserId && uf.IsRecommended)
                .Select(uf => uf.TaggetFollowerId.ToString())
                .ToListAsync(); 

            // // Lấy danh sách người dùng không bao gồm người dùng hiện tại và những người đã theo dõi
            // var recommendedUsers = await _context.IUsers
            //     .Where(u => u.Id != userId && !followedUserIds.Contains(u.Id.ToString()))
            //     .Take(10)
            //     .ToListAsync();

            if (getFollowerList_byCurrentUser == null || !getFollowerList_byCurrentUser.Any())
            {
                return NoContent();
            } 
            else  {
                return Ok(getFollowerList_byCurrentUser);
            }
        }

        [HttpPost("add-friend")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> SetUserRecommendation([FromBody] string taggetFollowerId)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var userFlag = new UserRecommenationFlag
            {
                UserId = Guid.Parse(currentUserId),
                TaggetFollowerId = Guid.Parse(taggetFollowerId),
                IsRecommended = true
            };

            _context.URFlags.Add(userFlag);
            await _context.SaveChangesAsync();

            return Ok("Recommendation set successfully.");
        }

    }
}