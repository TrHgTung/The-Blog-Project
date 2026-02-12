using System.Net;
using Microsoft.AspNetCore.Mvc;
using UserService.Data;
using UserService.Model;
using System.Security.Claims;
using UserService.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace UserService.Controllers
{

    [ApiController]
    [Route("api/user-service/[controller]")]
    public class PostTopicController : ControllerBase
    {
        private readonly DataContext _context;

        public PostTopicController(DataContext context)
        {
            _context = context;
        }
        
        // get all posts of a topic
        [HttpGet("all-posts/{topicId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> GetAllPostsOfTopic(Guid topicId)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }

            var getAllPostsInfo = await _context.PostTopics
                .AsNoTracking()
                .Where(p => p.TopicId == topicId && p.IsActive)
                .Select(p => new
                {
                    p.Id,
                    p.PostSlug,
                    p.PostTitle,
                    p.PostContent,
                    p.UserId,
                    p.CreatedAt
                })
                .ToListAsync();

            var getUpvotesAndDownvotes_ForEachPost = new List<object>();
            foreach (var post in getAllPostsInfo)
            {
                var upvoteCount = await _context.PostVotes
                    .AsNoTracking()
                    .Where(pv => pv.PostId == post.Id && pv.IsUpvote)
                    .CountAsync(); // đếm số upvote

                var downvoteCount = await _context.PostVotes
                    .AsNoTracking()
                    .Where(pv => pv.PostId == post.Id && !pv.IsUpvote)
                    .CountAsync(); // đếm số downvote

                getUpvotesAndDownvotes_ForEachPost.Add(new
                {
                    PostId = post.Id,
                    Upvotes = upvoteCount,
                    Downvotes = downvoteCount
                });
            }

            return Ok(new 
            { 
                Posts = getAllPostsInfo,
                UpvotesAndDownvotes = getUpvotesAndDownvotes_ForEachPost
            });
        }

        // get details of a post
        [HttpGet("post-details/{postId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> GetPostDetails(Guid postId)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }

            var getPostDetails = await _context.PostTopics
                .AsNoTracking()
                .Where(p => p.Id == postId && p.IsActive)
                .Select(p => new
                {
                    p.Id,
                    p.PostSlug,
                    p.PostTitle,
                    p.PostContent,
                    p.HeroImage,
                    p.BackgroundColor,
                    p.UserId,
                    p.CreatedAt,
                    p.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (getPostDetails == null)
            {
                return NotFound("Post not found.");
            }

            var upvoteCount = await _context.PostVotes
                .AsNoTracking()
                .Where(pv => pv.PostId == postId && pv.IsUpvote)
                .CountAsync(); // đếm số upvote

            var downvoteCount = await _context.PostVotes
                .AsNoTracking()
                .Where(pv => pv.PostId == postId && !pv.IsUpvote)
                .CountAsync(); // đếm số downvote

            return Ok(new
            {
                PostDetails = getPostDetails,
                Upvotes = upvoteCount,
                Downvotes = downvoteCount
            });
        }

        [HttpPost("create-post")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> CreatePostInTopic(PostDto dto)
        {
            var validateDtoCheckPoint = SecureValidateDto.ValidatePostDto(dto);
            if (!validateDtoCheckPoint.IsValid)
            {
                return BadRequest(validateDtoCheckPoint.Errors);
            }
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null)
            {
                return Unauthorized();
            }
            const string chars = "abcdefghijklmnopqrstuvwxyz";
            var rand = new Random();
            var generateRandomKeywords = new String(Enumerable.Repeat(chars, 3)
                .Select(s => s[rand.Next(s.Length)]).ToArray());
            var generatePostSlug = dto.PostTitle.ToLower().Replace(" ", "-") + "-" + generateRandomKeywords.ToString();
            var setPostBackgroundColor = dto.BackgroundColor ?? "system";
            var setPostHeroImage = dto.HeroImage ?? "1.png";
            var timeNow = DateTime.UtcNow;
            var createPostTopic = new PostTopic
            {
                Id = Guid.NewGuid(),
                PostSlug = generatePostSlug,
                PostTitle = dto.PostTitle,
                PostContent = dto.PostContent,
                HeroImage = setPostHeroImage,
                BackgroundColor = setPostBackgroundColor,
                TopicId = dto.TopicId,
                UserId = Guid.Parse(getCurrentUserId),
                IsActive = true,
                CreatedAt = timeNow,
                UpdatedAt = timeNow
            };

            _context.PostTopics.Add(createPostTopic);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success_post = createPostTopic
            });
        }

        // edit a post
        [HttpPatch("edit-post/{postId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> EditPostInTopic(Guid postId, PostDto dto)
        {
            var validateDtoCheckPoint = SecureValidateDto.ValidatePostDto(dto);
            if (!validateDtoCheckPoint.IsValid)
            {
                return BadRequest(validateDtoCheckPoint.Errors);
            }
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null)
            {
                return Unauthorized();
            }

            var getPost = await _context.PostTopics
                .Where(p => p.Id == postId && p.IsActive)
                .FirstOrDefaultAsync();

            if (getPost == null)
            {
                return NotFound("Post not found.");
            }

            if (getPost.UserId != Guid.Parse(getCurrentUserId))
            {
                return Forbid("Unauthorized");
            }

            getPost.PostTitle = dto.PostTitle;
            getPost.PostContent = dto.PostContent;
            getPost.HeroImage = dto.HeroImage ?? getPost.HeroImage;
            getPost.BackgroundColor = dto.BackgroundColor ?? getPost.BackgroundColor;
            getPost.UpdatedAt = DateTime.UtcNow;

            _context.PostTopics.Update(getPost);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success_post = getPost
            });
        }

        // soft delete a post
        [HttpPatch("delete-post/{postId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> DeletePostInTopic(Guid postId)
        {
            // var validateDtoCheckPoint = SecureValidateDto.ValidatePostDto(dto);
            // if (!validateDtoCheckPoint.IsValid)
            // {
            //     return BadRequest(validateDtoCheckPoint.Errors);
            // }
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null)
            {
                return Unauthorized();
            }

            var getPost = await _context.PostTopics
                .Where(p => p.Id == postId && p.IsActive)
                .FirstOrDefaultAsync();

            if (getPost == null)
            {
                return NotFound("Post not found.");
            }

            if (getPost.UserId != Guid.Parse(getCurrentUserId))
            {
                return Forbid("Unauthorized");
            }

            getPost.IsActive = false;
            getPost.UpdatedAt = DateTime.UtcNow;

            _context.PostTopics.Update(getPost);
            await _context.SaveChangesAsync();

            return Ok("Post deleted.");
        }

        //  upvote a post
        [HttpPost("upvote/{postId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> UpvotePost(Guid postId)
        {
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null)
            {
                return Unauthorized();
            }

            var checkRecordIsExistOrNot = await _context.PostVotes
                .Where(pv => pv.PostId == postId && pv.UserId == Guid.Parse(getCurrentUserId))
                .FirstOrDefaultAsync();

            if (checkRecordIsExistOrNot != null)
            {
                // create new record and mark as upvote
                var newUpvote = new PostVote
                {
                    Id = Guid.NewGuid(),
                    PostId = postId,
                    UserId = Guid.Parse(getCurrentUserId),
                    IsUpvote = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.PostVotes.Add(newUpvote);
                await _context.SaveChangesAsync();

                return Ok("Post upvoted.");
            }
            else // trong trường hợp đã có bản ghi thì chỉ cần cập nhật lại IsUpvote
            {
                checkRecordIsExistOrNot.IsUpvote = true;
                _context.PostVotes.Update(checkRecordIsExistOrNot);
                await _context.SaveChangesAsync();
                return Ok("Post upvoted.");
            }
        }

        // un-upvote a post
        [HttpPatch("un-upvote/{postId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> UnUpvotePost(Guid postId)
        {
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null)
            {
                return Unauthorized();
            }

            var checkRecordIsExistOrNot = await _context.PostVotes
                .Where(pv => pv.PostId == postId && pv.UserId == Guid.Parse(getCurrentUserId))
                .FirstOrDefaultAsync();

            if (checkRecordIsExistOrNot != null
            //  || checkRecordIsExistOrNot.IsUpvote == true // khôgn cần đặt thêm điều kiện check này vì kiểu gì cũng phải update lại IsUpvote thành false để un-upvote, 
                                                            // nếu đã là false rồi thì update lại vẫn là false thôi, không ảnh hưởng gì cả
             )
            {
                 checkRecordIsExistOrNot.IsUpvote = false;
                _context.PostVotes.Update(checkRecordIsExistOrNot);
                await _context.SaveChangesAsync();

                return Ok("Post un-upvoted.");  
            }
            else
            {
                return BadRequest();
            }
        }

        //  downvote a post
        [HttpPatch("downvote/{postId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> DownvotePost(Guid postId)
        {
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null)
            {
                return Unauthorized();
            }

            var checkCurrentPost = await _context.PostVotes
                .Where(pv => pv.PostId == postId && pv.UserId == Guid.Parse(getCurrentUserId))
                .FirstOrDefaultAsync();

            // trong trường hợp chưa có bản ghi của postId này + của UserId này -> thì sẽ tạo 1 bản ghi mới và đánh dầu là downvote
            if (checkCurrentPost == null)
            {
                var newDownvote = new PostVote
                {
                    Id = Guid.NewGuid(),
                    PostId = postId,
                    UserId = Guid.Parse(getCurrentUserId),
                    IsUpvote = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.PostVotes.Add(newDownvote);
                await _context.SaveChangesAsync();

                return Ok("Post downvoted.");
            }
            else // trong trường hợp đã có bản ghi rồi thì chỉ cần update lại giá trị IsUpvote thành false để đánh dấu là downvote
            {
                checkCurrentPost.IsUpvote = false;
                _context.PostVotes.Update(checkCurrentPost);
                await _context.SaveChangesAsync();

                return Ok("Post downvoted.");
            }
        }

        // un-downvote a post
        [HttpPatch("un-downvote/{postId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> UndownvotePost(Guid postId)
        {
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null)
            {
                return Unauthorized();
            }

            var checkCurrentPost = await _context.PostVotes
                .Where(pv => pv.PostId == postId && pv.UserId == Guid.Parse(getCurrentUserId))
                .FirstOrDefaultAsync();

            // if (checkCurrentPost == null)
            // {
            //     return BadRequest("No record available");
            // }

            if (checkCurrentPost != null)
            {
                checkCurrentPost.IsUpvote = true;
                _context.PostVotes.Update(checkCurrentPost);
                await _context.SaveChangesAsync();

                return Ok("Post un-upvoted.");
            }
            else
            {
                return BadRequest();
            }
        }

    }
}