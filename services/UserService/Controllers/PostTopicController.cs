using System.Net;
using Microsoft.AspNetCore.Mvc;
using UserService.Data;
using UserService.Model;
using System.Security.Claims;
using UserService.Dto;

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
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null)
            {
                return Unauthorized();
            }
            var generateRandomNumber = new Random().Next(1000, 9999);
            var generatePostSlug = dto.PostTitle.ToLower().Replace(" ", "-") + "-" + generateRandomNumber.ToString();
            var createPostTopic = new PostTopic
            {
                Id = Guid.NewGuid(),
                PostSlug = generatePostSlug,
                PostTitle = dto.PostTitle,
                PostContent = dto.PostContent,
                HeroImage = dto.HeroImage,
                BackgroundColor = dto.BackgroundColor,
                TopicId = dto.TopicId,
                UserId = Guid.Parse(getCurrentUserId),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.PostTopics.Add(createPostTopic);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Post created successfully",
                PostId = postTopic.Id
            });
        }
    }
}