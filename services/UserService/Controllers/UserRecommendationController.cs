using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UserService.Model;
using UserService.Dto;

namespace UserService.Controllers
{

    [ApiController]
    [Route("api/user-service/[controller]")]
    public class UserRecommendationController : ControllerBase
    {
        private readonly DataContext _context;

        public UserRecommendationController(DataContext context)
        {
            _context = context;
        }

        [HttpGet("friend-adding-recommendations")]
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
                .Where(uf => uf.UserId == currentUserId && uf.IsRecommended)
                .Join(
                    _context.UPSInfo
                        .AsNoTracking(),
                    uf => uf.TaggetFollowerId,
                    upsi => upsi.UserId,
                    (uf, upsi) => new
                    {
                        UserId = upsi.UserId,
                        UserName = upsi.Username,
                    }
                )
                .ToListAsync();

            return Ok(getFollowerList_byCurrentUser);
        }

        // get all topics (for recommendation purpose)
        [HttpGet("get-all-topics")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> GetAllTopics()
        {
            var getAllTopics = await _context.UserTopics
                .AsNoTracking()
                .Select(t => new
                {
                    t.Id,
                    t.TopicName,
                    t.TopicDescription,
                    t.TopicBackgroundImage,
                    t.TopicBackgroundColor,
                    t.TopicSlug
                })
                .ToListAsync();

            return Ok(getAllTopics);
        }


    }
}