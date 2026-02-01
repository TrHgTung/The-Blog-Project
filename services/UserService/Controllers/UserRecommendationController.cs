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


        [HttpPost("create-a-topic")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> CreateSocialTopic(TopicDto topicDto)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId == null)
            {
                return Unauthorized();
            }

            // xử lý topic slug
            var topicSlug = topicDto.TopicName.ToLower().Replace(" ", "-");

            // check coi topic slug đã tồn tại chưa
            var existingTopic = await _context.UserTopics
                .FirstOrDefaultAsync(t => t.TopicSlug == topicSlug);
            if (existingTopic != null)
            {
                return BadRequest("Topic slug already exists. Please choose a different topic name.");
            }

            // validate topic name
            if (string.IsNullOrWhiteSpace(topicDto.TopicName) || topicDto.TopicName.Length > 100)
            {
                return BadRequest("Topic name is required and must be less than 100 characters.");
            }

            // validate topic description
            if (string.IsNullOrWhiteSpace(topicDto.TopicDescription) || topicDto.TopicDescription.Length > 256)
            {
                return BadRequest("Topic description is required and must be less than 256 characters.");
            }

            // // validate hastag  --> hashtag đem qua phần PostService
            // if (string.IsNullOrWhiteSpace(topicDto.TopicHashtag) || topicDto.TopicHashtag.Length > 128)
            // {
            //     return BadRequest("Topic hashtag is required and must be less than 128 characters.");
            // }

            // validate image option & color
            if (string.IsNullOrWhiteSpace(topicDto.TopicBackgroundImage) || topicDto.TopicBackgroundImage.Length > 3 ||
                string.IsNullOrWhiteSpace(topicDto.TopicBackgroundColor) || topicDto.TopicBackgroundColor.Length > 32)
            {
                return BadRequest("Topic background image and color are required.");
            }

            var newTopic = new UserTopic
            {
                Id = Guid.NewGuid(),
                TopicSlug = topicSlug,
                TopicName = topicDto.TopicName,
                TopicDescription = topicDto.TopicDescription,
                TopicBackgroundImage = topicDto.TopicBackgroundImage,
                TopicBackgroundColor = topicDto.TopicBackgroundColor,
                UserId = Guid.Parse(currentUserId),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.UserTopics.Add(newTopic);
            await _context.SaveChangesAsync();

            return Ok("Topic has been created.");
        }

        [HttpPost("join-to-topic/{topicId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> JoinATopic(Guid topicId)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }

            var currentUserId = Guid.Parse(getCurrentUser);

            // check topic tồn tại
            var topicExists = await _context.UserTopics
                .AsNoTracking()
                .AnyAsync(t => t.Id == topicId);

            if (!topicExists)
            {
                return NotFound("Topic not found.");
            }

            //check user đã join chưa
            var checkIfUserAlreadyJoinedTopci = await _context.TopicUserMembers
                .AnyAsync(tum => tum.UserId == currentUserId && tum.TopicId == topicId);

            if (checkIfUserAlreadyJoinedTopci)
            {
                return BadRequest("User already joined this topic. Cannot join again.");
            }

            var userJoinTopicChecker = new TopicUserMember
            {
                UserId = Guid.Parse(getCurrentUser),
                TopicId = topicId,
            };

            _context.TopicUserMembers.Add(userJoinTopicChecker);
            await _context.SaveChangesAsync();

            return Ok("Recommendation set successfully.");
        }

        // remove from topic


        // leave topic

        // get topic members

        // ...

    }
}