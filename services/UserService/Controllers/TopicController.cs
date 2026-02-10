using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserService.Data;
using UserService.Dto;
using UserService.Model;

namespace UserService.Controllers
{
    [ApiController]
    [Route("api/user-service/[controller]")]
    public class TopicController : ControllerBase
    {
        private readonly DataContext _context;
        public TopicController(DataContext context)
        {
            _context = context;
        }

        // USE-CASE 1: OWN A TOPIC

        // create a topic
        [HttpPost("create-a-topic")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> CreateSocialTopic(CreateTopicDto topicDto)
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

        // delete a topic
        [HttpPatch("delete-my-topic/{topicId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> RemoveTopic(Guid topicId)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }
            var currentUserId = Guid.Parse(getCurrentUser);
            // check topic tồn tại
            var checkTopicExistsOrNot = await _context.UserTopics
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (checkTopicExistsOrNot == null)
            {
                return NotFound("Topic not found.");
            }

            // check current user có phải chủ topic không
            if (checkTopicExistsOrNot.UserId != currentUserId)
            {
                return Forbid();
            }

            // xóa topic (soft delete)
            checkTopicExistsOrNot.IsActive = false;
            checkTopicExistsOrNot.UpdatedAt = DateTime.UtcNow;
            _context.UserTopics.Update(checkTopicExistsOrNot);

            await _context.SaveChangesAsync();

            return Ok("Topic: " + topicId + " has been deleted successfully.");
        }

        // remove from topic (kick member)  --> chỉ có chủ topic mới làm đc -> check coi current user có phải chủ topic ko
        [HttpPatch("remove-user-from-topic/{topicId}/{userId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> RemoveMemberFromTopic(Guid topicId, Guid userId) // note: userId là của member bị kick
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }

            var currentUserId = Guid.Parse(getCurrentUser);

            // check topic tồn tại
            var checkTopicExistsOrNot = await _context.UserTopics
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (checkTopicExistsOrNot == null)
            {
                return NotFound("Topic not found.");
            }

            // check current user có phải chủ topic không
            if (checkTopicExistsOrNot.UserId != currentUserId)
            {
                return Forbid("Only the topic owner can remove members, and you are not the owner.");
            }

            //check userId có phải là member của topic không
            var checkUserIsJoinedTopicOrNot = await _context.TopicUserMembers
                .FirstOrDefaultAsync(t => t.UserId == userId && t.TopicId == topicId);

            if (checkUserIsJoinedTopicOrNot == null)
            {
                return BadRequest("This user is not a member of the topic.");
            }

            _context.TopicUserMembers.Remove(checkUserIsJoinedTopicOrNot);
            await _context.SaveChangesAsync();

            return Ok("User " + userId + " has been removed from the topic.");
        }

        // get topic members
        [HttpGet("topic-members/{topicId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> GetTopicMembers(Guid topicId)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }

            // check topic tồn tại
            var checkTopicExistsOrNot = await _context.UserTopics
                .AsNoTracking()
                .AnyAsync(t => t.Id == topicId);

            if (!checkTopicExistsOrNot)
            {
                return NotFound("Topic not found.");
            }

            var getAllTopicMembers = await _context.TopicUserMembers
                .Where(tm => tm.TopicId == topicId)
                .Join(
                    _context.UPSInfo
                        .AsNoTracking(),
                    tm => tm.UserId,
                    upsi => upsi.UserId,
                    (tm, upsi) => new
                    {
                        UserId = upsi.UserId,
                        UserName = upsi.Username,
                        FullName = upsi.FirstName + " " + upsi.LastName,
                        Homeplace = upsi.CurrentCity,
                        Avatar = upsi.AvatarImage
                    }
                )
                .ToListAsync();

            return Ok(getAllTopicMembers);
        }

        // edit topic info owned by the current user
        [HttpPatch("edit-my-topic/{topicId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> EditMyTopics(Guid topicId, EditTopicDto topicDto)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }
            var currentUserId = Guid.Parse(getCurrentUser);
            // check topic tồn tại
            var checkTopicExistsOrNot = await _context.UserTopics
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (checkTopicExistsOrNot == null)
            {
                return NotFound("Topic not found.");
            }

            // check current user có phải chủ topic không
            if (checkTopicExistsOrNot.UserId != currentUserId)
            {
                return Forbid();
            }

            //  validate: 1. bằng controller + 2. bằng data annotations trong DTO
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
            // validate image option & color
            if (string.IsNullOrWhiteSpace(topicDto.TopicBackgroundImage) || topicDto.TopicBackgroundImage.Length > 3 ||
                string.IsNullOrWhiteSpace(topicDto.TopicBackgroundColor) || topicDto.TopicBackgroundColor.Length > 32)
            {
                return BadRequest("Topic background image and color are required.");
            }
            // cập nhật thông tin topic
            checkTopicExistsOrNot.TopicName = topicDto.TopicName;
            checkTopicExistsOrNot.TopicDescription = topicDto.TopicDescription;
            checkTopicExistsOrNot.TopicBackgroundImage = topicDto.TopicBackgroundImage;
            checkTopicExistsOrNot.TopicBackgroundColor = topicDto.TopicBackgroundColor;
            checkTopicExistsOrNot.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok("Topic information has been updated.");
        }

        // get all topics owned by the current user
        [HttpGet("my-owned-topics")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> GetAllMyTopics()
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }

            var currentUserId = Guid.Parse(getCurrentUser);

            var getAllTopicsOwnedByCurrentUser = await _context.UserTopics
                .Where(t => t.UserId == currentUserId)
                .ToListAsync();

            return Ok(getAllTopicsOwnedByCurrentUser);
        }

        // change the owner of the topic (transfer ownership 
        [HttpPatch("transfer-topic-ownership/{topicId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> TransferOwnerTopic(Guid topicId, TransferOwnerTopicDto dto)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }
            var currentUserId = Guid.Parse(getCurrentUser);
            // check topic tồn tại
            var checkTopicExistsOrNot = await _context.UserTopics
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (checkTopicExistsOrNot == null)
            {
                return NotFound("Topic not found.");
            }

            // check current user có phải chủ topic không
            if (checkTopicExistsOrNot.UserId != currentUserId)
            {
                return Forbid();
            }

            // chuyển quyền sở hữu topic  --> cần truyền userId của member mới vào body
            checkTopicExistsOrNot.UserId = dto.UserId;
            checkTopicExistsOrNot.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok("The topic " + topicId + " has been transferred to new owner: " + dto.UserId);
        }

        // remove a post from topic
        // if you're the owner of the topic, you can remove specific posts you want
        [HttpPatch("remove-post/{postId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> RemovePost(Guid topicId, RemovePostFromTopicDto dto)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }
            var currentUserId = Guid.Parse(getCurrentUser);

            // check topic tồn tại hay ko
            var checkTopicExistsOrNot = await _context.UserTopics
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (checkTopicExistsOrNot == null)
            {
                return NotFound("Topic not found.");
            }

            // check current user có phải chủ topic không
            if (checkTopicExistsOrNot.UserId != currentUserId)
            {
                return Forbid();
            }

            // remove post from topic (soft delete)
            var checkPostTopicExistsOrNot = await _context.PostTopics
                .FirstOrDefaultAsync(p => p.Id == dto.PostId && p.TopicId == dto.TopicId);

            if (checkPostTopicExistsOrNot == null)
            {
                return NotFound("Post not found in the specified topic.");
            }

            checkPostTopicExistsOrNot.IsActive = false;
            checkPostTopicExistsOrNot.UpdatedAt = DateTime.UtcNow;
            _context.PostTopics.Update(checkPostTopicExistsOrNot);

            await _context.SaveChangesAsync();

            return Ok("You've successfully removed the post " + dto.PostId + " from the topic " + dto.TopicId);
        }


        // USE-CASE 2: NORMAL USER - MEMBER OF THE TOPIC

        // join a topic
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
            var checkTopicExistsOrNot = await _context.UserTopics
                .AsNoTracking()
                .AnyAsync(t => t.Id == topicId);

            if (!checkTopicExistsOrNot)
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

        // chủ động leave a topic
        [HttpPatch("leave-topic/{topicId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> LeaveATopic(Guid topicId)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }

            var currentUserId = Guid.Parse(getCurrentUser);

            // check topic tồn tại
            var checkTopicExistsOrNot = await _context.UserTopics
                .AsNoTracking()
                .AnyAsync(t => t.Id == topicId);

            if (!checkTopicExistsOrNot)
            {
                return NotFound("Topic not found.");
            }

            //check current user đã join cái topic này hay chưa
            var checkCurrentUserIsJoinedTopicOrNot = await _context.TopicUserMembers
                .FirstOrDefaultAsync(t => t.UserId == currentUserId && t.TopicId == topicId);

            if (checkCurrentUserIsJoinedTopicOrNot == null)
            {
                return BadRequest("You - the current user - have not joined this topic before");
            }

            _context.TopicUserMembers.Remove(checkCurrentUserIsJoinedTopicOrNot);
            await _context.SaveChangesAsync();

            return Ok("Left topic!");
        }

        // get (see) topic details by topicId
        [HttpGet("topic-details/{topicId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> GetTopicDetails(Guid topicId)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }

            // check topic tồn tại
            var GetTopicDetails = await _context.UserTopics
                .AsNoTracking()
                .Where(t => t.Id == topicId)
                .Select(t => new
                {
                    t.Id,
                    t.TopicName,
                    t.TopicDescription,
                    t.TopicBackgroundImage,
                    t.TopicBackgroundColor,
                    t.TopicSlug,
                    t.UserId,
                    t.CreatedAt,
                    t.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (GetTopicDetails == null)
            {
                return NotFound("Topic not found or system error");
            }

            return Ok(GetTopicDetails);
        }

    }

}