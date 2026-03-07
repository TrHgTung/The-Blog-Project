using System.Net;
using Microsoft.AspNetCore.Mvc;
using UserService.Data;
using UserService.Model;
using System.Security.Claims;
using TheBlog.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography.X509Certificates;
using UserService.MessageBus;
using UserService.Dto;


namespace UserService.Controllers
{

    [ApiController]
    [Route("api/user-service/[controller]")]
    public class PostTopicController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IMessageBus _messageBus;

        public PostTopicController(DataContext context, IMessageBus messageBus)
        {
            _context = context;
            _messageBus = messageBus;
        }
        // get all posts show in newsfeed
        // these posts are from topics that the user has joined
        // and posts that are trending
        [HttpGet("post-newsfeed")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> GetNewsfeed()
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }
            var currentUserId = Guid.Parse(getCurrentUser);

            // lấy danh sách TopicId mà user đã join
            var joinedTopicIds = await _context.TopicUserMembers
                .Where(tum => tum.UserId == currentUserId)
                .Select(tum => tum.TopicId)
                .ToListAsync();

            if (joinedTopicIds.Count == 0)
            {
                return Ok(new 
                { 
                    Posts = new List<object>(),
                    UpvotesAndDownvotes = new List<object>()
                });
            }

            // //lấy các bài viết từ những topic đó
            // var posts = await _context.PostTopics
            //     .AsNoTracking()
            //     .Where(p => joinedTopicIds.Contains(p.TopicId) && p.IsActive)
            //     .Join(_context.UPSInfo, p => p.UserId, u => u.UserId, (p, u) => new { p, u })
            //     .Select(x => new
            //     {
            //         x.p.Id,
            //         x.p.PostSlug,
            //         x.p.PostTitle,
            //         x.p.PostContent,
            //         x.p.TopicId,
            //         x.p.UserId,
            //         x.p.CreatedAt,
            //         x.p.HeroImage,
            //         x.p.BackgroundColor,
            //         AuthorName = x.u.Username,
            //         AuthorAvatar = x.u.AvatarImage
            //     })
            //     .OrderByDescending(p => p.CreatedAt)
            //     // .Take(50) // Giới hạn 50 bài gần nhất
            //     .ToListAsync();

            var posts = await _context.PostTopics
                .AsNoTracking()
                .Where(p => joinedTopicIds.Contains(p.TopicId) && p.IsActive)
                .Select(p => new
                {
                    p.Id,
                    p.PostSlug,
                    p.PostTitle,
                    p.PostContent,
                    p.TopicId,
                    p.UserId,
                    p.CreatedAt,
                    p.HeroImage,
                    p.BackgroundColor,
                })
                .ToListAsync();

            var additionalInfo = new List<object>();
            foreach (var post in posts)
            {
                var authorProfile = await _context.UPSInfo
                    .Where(u => u.UserId == post.UserId)
                    .Select(u => new { u.Username, u.AvatarImage })
                    .FirstOrDefaultAsync();

                var upvoteCount = await _context.PostVotes.CountAsync(pv => pv.PostId == post.Id && pv.IsUpvote);
                var downvoteCount = await _context.PostVotes.CountAsync(pv => pv.PostId == post.Id && !pv.IsUpvote);
                
                additionalInfo.Add(new 
                {
                    PostId = post.Id,
                    Upvotes = upvoteCount,
                    Downvotes = downvoteCount,
                    AuthorName = authorProfile?.Username ?? "Anonymous",
                    AuthorAvatar = authorProfile?.AvatarImage ?? ""
                });
            }

            return Ok(new
            {
                posts = posts,
                moreInfo = additionalInfo
            });
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
                .Join(_context.UPSInfo, p => p.UserId, u => u.UserId, (p, u) => new { p, u })
                .Select(x => new
                {
                    x.p.Id,
                    x.p.PostSlug,
                    x.p.PostTitle,
                    x.p.PostContent,
                    x.p.HeroImage,
                    x.p.BackgroundColor,
                    x.p.UserId,
                    x.p.CreatedAt,
                    x.p.UpdatedAt,
                    AuthorName = x.u.Username,
                    AuthorAvatar = x.u.AvatarImage
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

        // get posts from all topics the user has joined (Recommendation)
        [HttpGet("joined-topics-posts")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> GetPostsFromJoinedTopics()
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }
            var currentUserId = Guid.Parse(getCurrentUser);

            // 1. Lấy danh sách TopicId mà user đã join
            var joinedTopicIds = await _context.TopicUserMembers
                .Where(tum => tum.UserId == currentUserId)
                .Select(tum => tum.TopicId)
                .ToListAsync();

            if (joinedTopicIds.Count == 0)
            {
                return Ok(new { Posts = new List<object>(), UpvotesAndDownvotes = new List<object>() });
            }

            // 2. Lấy các bài viết từ những topic đó
            var posts = await _context.PostTopics
                .AsNoTracking()
                .Where(p => joinedTopicIds.Contains(p.TopicId) && p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .Take(50) // Giới hạn 50 bài gần nhất
                .Join(_context.UPSInfo, p => p.UserId, u => u.UserId, (p, u) => new { p, u })
                .Select(x => new
                {
                    x.p.Id,
                    x.p.PostSlug,
                    x.p.PostTitle,
                    x.p.PostContent,
                    x.p.TopicId,
                    x.p.UserId,
                    x.p.CreatedAt,
                    x.p.HeroImage,
                    x.p.BackgroundColor,
                    AuthorName = x.u.Username,
                    AuthorAvatar = x.u.AvatarImage
                })
                .ToListAsync();

            var upvotesAndDownvotes = new List<object>();
            foreach (var post in posts)
            {
                var upvoteCount = await _context.PostVotes.CountAsync(pv => pv.PostId == post.Id && pv.IsUpvote);
                var downvoteCount = await _context.PostVotes.CountAsync(pv => pv.PostId == post.Id && !pv.IsUpvote);
                upvotesAndDownvotes.Add(new { PostId = post.Id, Upvotes = upvoteCount, Downvotes = downvoteCount });
            }

            return Ok(new
            {
                Posts = posts,
                UpvotesAndDownvotes = upvotesAndDownvotes
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

            // 1/ tạo post
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

            // 2/ tạo giá trị trending ban đầu cho post này
            var initTrendingValue = new PostTrendingValue
            {
                Id = Guid.NewGuid(),
                PostId = createPostTopic.Id,
                TrendingScore = 0
            };

            _context.PostTrendingValues.Add(initTrendingValue);
            await _context.SaveChangesAsync();

            // 3/ retủn
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
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null || !Guid.TryParse(getCurrentUserId, out var userId))
            {
                return Unauthorized();
            }
            // check post có tồn tại hay ko 
            var getPost = await _context.PostTopics
                .Where(p => p.Id == postId && p.IsActive)
                .FirstOrDefaultAsync();

            if (getPost == null)
            {
                return NotFound("Post not found.");
            }

            // if (getPost.UserId != Guid.Parse(getCurrentUserId))
            // {
            //     return Forbid("Unauthorized");
            // }

            // using transaction for multiple operations
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1/ update lại thông tin status của post (isActive -> false)
                await _context.PostTopics.Where(p => p.Id == postId)
                    .ExecuteUpdateAsync(p => p
                        .SetProperty(pt => pt.IsActive, false)
                        .SetProperty(pt => pt.UpdatedAt, DateTime.UtcNow)
                    );

                // 2/ delêt tất cả comment + del all reply của post này (isActive -> false)
                await _context.CommentPosts.Where(cmt => cmt.PostId == postId)
                    .ExecuteUpdateAsync(p => p
                        .SetProperty(pt => pt.IsActive, false)
                        .SetProperty(pt => pt.UpdatedAt, DateTime.UtcNow)
                    );

                await _context.ReplyComments.Where(r => _context.CommentPosts
                            .Where(c => c.PostId == postId)
                            .Select(c => c.Id)
                            .Contains(r.CommentPostId) //tìm tất cả reply thuộc các comment đó
                            && r.IsActive
                        )
                    .ExecuteUpdateAsync(r => r
                        .SetProperty(x => x.IsActive, false)
                        .SetProperty(x => x.UpdatedAt, DateTime.UtcNow));

                await transaction.CommitAsync();

                return Ok("Post deleted.");
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An error occurred while deleting the post.");
            }
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

                // gửi message để calculate trending score
                _messageBus.Publish("post-trending", new
                {
                    PostId = postId
                });

                return Ok("Post upvoted.");
            }
            else // trong trường hợp đã có bản ghi thì chỉ cần cập nhật lại IsUpvote
            {
                checkRecordIsExistOrNot.IsUpvote = true;
                _context.PostVotes.Update(checkRecordIsExistOrNot);
                await _context.SaveChangesAsync();

                // gửi message để calculate trending score
                _messageBus.Publish("post-trending", new
                {
                    PostId = postId
                });

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

                // gửi message để calculate trending score
                _messageBus.Publish("post-trending", new
                {
                    PostId = postId
                });

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

                                // gửi message để calculate trending score
                _messageBus.Publish("post-trending", new
                {
                    PostId = postId
                });

                return Ok("Post downvoted.");
            }
            else // trong trường hợp đã có bản ghi rồi thì chỉ cần update lại giá trị IsUpvote thành false để đánh dấu là downvote
            {
                checkCurrentPost.IsUpvote = false;
                _context.PostVotes.Update(checkCurrentPost);
                await _context.SaveChangesAsync();

                                // gửi message để calculate trending score
                _messageBus.Publish("post-trending", new
                {
                    PostId = postId
                });

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

            if (checkCurrentPost != null)
            {
                checkCurrentPost.IsUpvote = true;
                _context.PostVotes.Update(checkCurrentPost);
                await _context.SaveChangesAsync();

                // gửi message để calculate trending score
                _messageBus.Publish("post-trending", new
                {
                    PostId = postId
                });

                return Ok("Post un-upvoted.");
            }
            else
            {
                return BadRequest();
            }
        }


        // COMMENT ON POSTs

        // get all comments of a post
        [HttpGet("show-all-comments/{postId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> GetAllComments(Guid postId)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }

            var getAllComments = await _context.CommentPosts
                .AsNoTracking()
                .Where(c => c.PostId == postId && c.IsActive)
                .Select(c => new
                {
                    c.Id,
                    c.CommentContent,
                    c.UserId,
                    c.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                Comments = getAllComments
            });
        }

        // create comment on a post
        [HttpPost("create-comment/{postId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> CreateCommentOnPost(Guid postId, UserService.Dto.CommentDto dto)
        {
            var validateDtoCheckPoint = SecureValidateDto.ValidateCommentDto(dto);
            if (!validateDtoCheckPoint.IsValid)
            {
                return BadRequest(validateDtoCheckPoint.Errors);
            }
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null)
            {
                return Unauthorized();
            }

            var createComment = new CommentPost
            {
                Id = Guid.NewGuid(),
                CommentContent = dto.CommentContent,
                PostId = postId,
                UserId = Guid.Parse(getCurrentUserId),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CommentPosts.Add(createComment);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success_comment = createComment
            });
        }

        // remove comment on a post (soft delete)
        [HttpPatch("delete-comment/{commentId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> DeleteCommentOnPost(Guid commentId)
        {
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null)
            {
                return Unauthorized();
            }
            // checkj coi comment có tồn tại ko
            var getComment = await _context.CommentPosts
                .Where(c => c.Id == commentId && c.IsActive)
                .FirstOrDefaultAsync();

            if (getComment == null)
            {
                return NotFound("Comment not found.");
            }

            // if (getComment.UserId != Guid.Parse(getCurrentUserId))
            // {
            //     return Forbid("Unauthorized");
            // }

            // using transaction for multiple operations
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1/ change status của comment (isActive -> false)
                await _context.CommentPosts.Where(cmt => cmt.Id == commentId)
                    .ExecuteUpdateAsync(cmt => cmt
                        .SetProperty(x => x.IsActive, false)
                        .SetProperty(x => x.UpdatedAt, DateTime.UtcNow)
                    );

                // 2/ delête tất cả reply của comment này (isActive -> false)
                await _context.ReplyComments.Where(r => r.CommentPostId == commentId)
                    .ExecuteUpdateAsync(r => r
                        .SetProperty(x => x.IsActive, false)
                        .SetProperty(x => x.UpdatedAt, DateTime.UtcNow)
                    );

                await transaction.CommitAsync();

                return Ok("Comment deleted.");
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An error occurred while deleting the comment.");
            }
        }

        // REPLY OF A COMMENT

        // get all replies of a coment
        [HttpGet("show-all-replies/{commentId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> GetAllReplies(Guid commentId)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }

            var getAllReplies = await _context.ReplyComments
                .AsNoTracking()
                .Where(r => r.CommentPostId == commentId && r.IsActive)
                .Select(r => new
                {
                    r.Id,
                    r.ReplyCmtContent,
                    r.UserId,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                Replies = getAllReplies
            });
        }

        // create reply of a comment
        [HttpPost("create-reply/{commentId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> CreateReplyOfComment(Guid commentId, UserService.Dto.ReplyCmtDto dto)
        {
            var validateDtoCheckPoint = SecureValidateDto.ValidateReplyCmtDto(dto);
            if (!validateDtoCheckPoint.IsValid)
            {
                return BadRequest(validateDtoCheckPoint.Errors);
            }
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null)
            {
                return Unauthorized();
            }

            var createReply = new ReplyComment
            {
                Id = Guid.NewGuid(),
                CommentPostId = commentId,
                ReplyCmtContent = dto.ReplyCmtContent,
                UserId = Guid.Parse(getCurrentUserId),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ReplyComments.Add(createReply);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success_reply = createReply
            });
        }

        // remove reply of a comment
        [HttpPatch("delete-reply/{replyId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> DeleteReplyOfComment(Guid replyId)
        {
            var getCurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (getCurrentUserId == null)
            {
                return Unauthorized();
            }

            var getReply = await _context.ReplyComments
                .Where(r => r.Id == replyId)
                .FirstOrDefaultAsync();

            if (getReply == null)
            {
                return NotFound("Reply not found.");
            }

            if (getReply.UserId != Guid.Parse(getCurrentUserId))
            {
                return Forbid("Unauthorized");
            }

            getReply.IsActive = false;
            getReply.UpdatedAt = DateTime.UtcNow;

            _context.ReplyComments.Update(getReply);
            await _context.SaveChangesAsync();

            return Ok("Reply deleted.");
        }

        // 
    }
}