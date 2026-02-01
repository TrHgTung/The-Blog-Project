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
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }
            var currentUserId = Guid.Parse(getCurrentUser);
            // Lấy danh sách người dùng được gợi ý theo user hiện tại
            var getFollowerList_byCurrentUser = await _context.URFlags
                .Where(uf => (uf.UserId == currentUserId || uf.TaggetFollowerId == currentUserId) && uf.IsRecommended)
                .ToListAsync();

            // if (getFollowerList_byCurrentUser == null || !getFollowerList_byCurrentUser.Any())
            // {
            //     return NoContent();
            // }
            // else
            // {
            return Ok(getFollowerList_byCurrentUser);
            // }
        } // refactor: 1 value chứa dạng string node của 2 userID, khi query trong controller thì sẽ contain id giúp giảm truy vấn db


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