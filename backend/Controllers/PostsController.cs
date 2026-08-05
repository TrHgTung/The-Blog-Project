using System.Security.Claims;
using backend.Data;
using backend.Data.DTOs;
using backend.Models;
using backend.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using backend.Utilities;
using System.Linq;
using Microsoft.AspNetCore.RateLimiting;
using backend.Services;

public record cartoonEntry(int Id, string Name);

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    /// <summary>
    /// Description: Quản lý bài đăng, bình luận và dữ liệu tương tác
    /// Author: tungth
    /// Create Date: 14-01-2026
    /// </summary>
    public class PostsController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly IHubContext<NotificationHub> _notificationHub;
        private readonly IGoogleIndexingService _googleIndexingService;
        private readonly IConfiguration _config;
        private readonly ILogger<PostsController> _logger;

        public PostsController(DataContext context, IWebHostEnvironment environment, IHubContext<NotificationHub> notificationHub, IGoogleIndexingService googleIndexingService, IConfiguration config, ILogger<PostsController> logger)
        {
            _context = context;
            _environment = environment;
            _notificationHub = notificationHub;
            _googleIndexingService = googleIndexingService;
            _config = config;
            _logger = logger;
        }

        /// Lấy danh sách bài viết thuộc các nhóm mà user đã tham gia, có phân trang (cho phép truy cập ẩn danh)
        /// Endpoint: GET api/posts
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PostDto>>> GetPosts([FromQuery] int page = 1, [FromQuery] int limit = 10, CancellationToken ct = default)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var query = _context.Posts.AsQueryable();

            if (!string.IsNullOrEmpty(userIdStr))
            {
                var userId = Guid.Parse(userIdStr);

                var joinedGroupIds = await _context.GroupMembers
                    .Where(g => g.UserId == userId)
                    .Select(g => g.GroupId)
                    .ToListAsync(ct);

                query = query.Where(p =>
                    p.GroupId.HasValue &&
                    joinedGroupIds.Contains(p.GroupId.Value));
            }

            var posts = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(p => new PostDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Slug = p.Slug,
                    Content = p.Content,
                    ImageUrl = p.ImageUrl,
                    Location = p.Location,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,

                    AuthorId = p.AuthorId,
                    AuthorName = p.Author.DisplayName,
                    AuthorProfilePicture = p.Author.ProfilePicture,
                    AuthorcartoonCharacter = p.Author.cartoonCharacter,

                    GroupId = p.GroupId,
                    GroupName = p.Group != null ? p.Group.Name : null,
                    GroupSlug = p.Group != null ? p.Group.Slug : null,
                    GroupCreatorId = p.Group != null ? p.Group.CreatorId : null,
                    Upvotes = p.Votes.Count(v => v.VoteType == 1),
                    Downvotes = p.Votes.Count(v => v.VoteType == -1),
                    UserVote = string.IsNullOrEmpty(userIdStr) ? 0 : p.Votes.Where(v => v.UserId == Guid.Parse(userIdStr)).Select(v => v.VoteType).FirstOrDefault()
                })
                .ToListAsync();

            return posts;
        }

        /// Tìm kiếm bài viết theo từ khóa (tiêu đề, nội dung, địa điểm, tác giả), hỗ trợ nhận diện tên Pokémon (cho phép truy cập ẩn danh)
        /// Endpoint: GET api/posts/search-results
        [AllowAnonymous]
        [HttpGet("search-results")]
        public async Task<IActionResult> GetPostsSearchResults([FromQuery] SearchDto searchDto, CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var q = searchDto.KeywordInput;
            var page = searchDto.Page;
            var limit = searchDto.Limit;

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var query = _context.Posts.AsQueryable();

            string? matchedcartoonName = null;
            int? matchedcartoonId = null;

            if (!string.IsNullOrWhiteSpace(q))
            {
                var lowerQ = q.ToLower();
                query = query.Where(p => 
                    p.Title.ToLower().Contains(lowerQ) || 
                    (p.Content != null && p.Content.ToLower().Contains(lowerQ)) ||
                    (p.Location != null && p.Location.ToLower().Contains(lowerQ)) ||
                    (p.Author != null && p.Author.DisplayName.ToLower().Contains(lowerQ))
                );

                var cartoonFilePath = Path.Combine(_environment.ContentRootPath, "Data", "cartoonNames.json");
                if (System.IO.File.Exists(cartoonFilePath))
                {
                    try
                    {
                        var cartoonList = System.Text.Json.JsonSerializer.Deserialize<List<cartoonEntry>>(
                            await System.IO.File.ReadAllTextAsync(cartoonFilePath, ct),
                            new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                        );
                        var match = cartoonList?.FirstOrDefault(p => p.Name.Equals(q.Trim(), StringComparison.OrdinalIgnoreCase));
                        if (match != null)
                        {
                            matchedcartoonName = match.Name;
                            matchedcartoonId = match.Id;
                        }
                    }
                    catch (System.Text.Json.JsonException ex)
                    {
                        _logger.LogWarning(ex, "[cartoonSearch] File cartoonNames.json bị sai định dạng JSON.");
                    }
                    catch (IOException ex)
                    {
                        _logger.LogWarning(ex, "[cartoonSearch] Không thể đọc file cartoonNames.json.");
                    }
                    catch (OperationCanceledException)
                    {
                        // pass
                    }
                }
            }

            var posts = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(p => new PostDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Slug = p.Slug,
                    Content = p.Content,
                    ImageUrl = p.ImageUrl,
                    Location = p.Location,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,

                    AuthorId = p.AuthorId,
                    AuthorName = p.Author.DisplayName,
                    AuthorProfilePicture = p.Author.ProfilePicture,
                    AuthorcartoonCharacter = p.Author.cartoonCharacter,

                    GroupId = p.GroupId,
                    GroupName = p.Group != null ? p.Group.Name : null,
                    GroupSlug = p.Group != null ? p.Group.Slug : null,
                    GroupCreatorId = p.Group != null ? p.Group.CreatorId : null,
                    Upvotes = p.Votes.Count(v => v.VoteType == 1),
                    Downvotes = p.Votes.Count(v => v.VoteType == -1),
                    UserVote = string.IsNullOrEmpty(userIdStr) ? 0 : p.Votes.Where(v => v.UserId == Guid.Parse(userIdStr)).Select(v => v.VoteType).FirstOrDefault()
                })
                .ToListAsync(ct);

            return Ok(new {
                posts = posts,
                matchedcartoon = matchedcartoonId.HasValue
                    ? new { id = matchedcartoonId.Value, name = matchedcartoonName }
                    : (object?)null
            });
        }

        /// Lấy danh sách bài viết của chính user đang đăng nhập
        /// Endpoint: GET api/posts/filter/my-own-post
        [HttpGet("filter/my-own-post")] 
        public async Task<ActionResult<IEnumerable<PostDto>>> GetMyOwnPost()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var posts = await _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Group)
                .Where(p => p.AuthorId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PostDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Slug = p.Slug,
                    Content = p.Content,
                    ImageUrl = p.ImageUrl,
                    Location = p.Location,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    AuthorId = p.AuthorId,
                    AuthorName = p.Author.DisplayName,
                    AuthorProfilePicture = p.Author.ProfilePicture,
                    AuthorcartoonCharacter = p.Author.cartoonCharacter,
                    GroupId = p.GroupId,
                    GroupName = p.Group != null ? p.Group.Name : null,
                    GroupSlug = p.Group != null ? p.Group.Slug : null,
                    GroupCreatorId = p.Group != null ? p.Group.CreatorId : null,
                    Upvotes = p.Votes.Count(v => v.VoteType == 1),
                    Downvotes = p.Votes.Count(v => v.VoteType == -1),
                    UserVote = p.Votes.Where(v => v.UserId == userId).Select(v => v.VoteType).FirstOrDefault()
                })
                .ToListAsync();
            return posts;
        }

        /// Lấy chi tiết một bài viết theo Id (cho phép truy cập ẩn danh)
        /// Endpoint: GET api/posts/{id}
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<PostDto>> GetPost(Guid id)
        {
            var post = await _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Group)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null) return NotFound();

            return new PostDto
            {
                Id = post.Id,
                Title = post.Title,
                Slug = post.Slug,
                Content = post.Content,
                ImageUrl = post.ImageUrl,
                Location = post.Location,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                AuthorId = post.AuthorId,
                AuthorName = post.Author.DisplayName,
                AuthorProfilePicture = post.Author.ProfilePicture,
                AuthorcartoonCharacter = post.Author.cartoonCharacter,
                GroupId = post.GroupId,
                GroupName = post.Group?.Name,
                GroupSlug = post.Group?.Slug,
                GroupCreatorId = post.Group?.CreatorId,
                Upvotes = post.Votes.Count(v => v.VoteType == 1),
                Downvotes = post.Votes.Count(v => v.VoteType == -1),
                UserVote = string.IsNullOrEmpty(User.FindFirstValue(ClaimTypes.NameIdentifier)) ? 0 : post.Votes.Where(v => v.UserId == Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)).Select(v => v.VoteType).FirstOrDefault()
            };
        }

        /// Tạo bài viết mới với hình ảnh, giới hạn 2 bài có ảnh và 10 bài/ngày, thông báo Google Indexing
        /// Endpoint: POST api/posts
        [Idempotent]
        [HttpPost]
        [EnableRateLimiting("resource")]
        [Microsoft.AspNetCore.Http.Timeouts.RequestTimeout("UploadPolicy")]
        [RequestSizeLimit(30 * 1024 * 1024)] // 30MB max for the whole request
        public async Task<ActionResult<PostDto>> CreatePost([FromForm] CreatePostDto createPostDto, CancellationToken ct = default)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Upload limit rules
            var startOfDay = DateTime.UtcNow.Date;
            var endOfDay = startOfDay.AddDays(1).AddTicks(-1);
            var checkImagePost_Today = await _context.Posts
                .CountAsync(p => p.AuthorId == userId && p.CreatedAt >= startOfDay && p.CreatedAt <= endOfDay && p.ImageUrl != null, ct);
            var checkUserPost_Today = await _context.Posts
                .CountAsync(p => p.AuthorId == userId && p.CreatedAt >= startOfDay && p.CreatedAt <= endOfDay, ct);

            if (checkImagePost_Today > 2)
            {
                return BadRequest("Bạn chỉ có thể đăng 2 bài viết đính kèm hình ảnh mỗi ngày.");
            }
            if(checkUserPost_Today > 10) {
                return BadRequest("Bạn chỉ có thể đăng 10 bài viết mỗi ngày.");
            }

            string? imageUrl = createPostDto.ImageUrl;

            if (createPostDto.ImageFile != null)
            {
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif" };
                var extension = Path.GetExtension(createPostDto.ImageFile.FileName).ToLower();
                
                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest("Chỉ chấp nhận các định dạng ảnh (.jpg, .jpeg, .png, .gif, .webp, .heic, .heif)");
                }

                if (createPostDto.ImageFile.Length > 20 * 1024 * 1024)
                {
                    return BadRequest("Kích thước ảnh không được vượt quá 20MB.");
                }
                imageUrl = await SaveImage(createPostDto.ImageFile);
            }

            var post = new Post
            {
                Id = Guid.NewGuid(),
                Title = createPostDto.Title,
                Slug = await GenerateUniqueSlug(createPostDto.Title),
                Content = createPostDto.Content,
                ImageUrl = imageUrl,
                Location = createPostDto.Location != null ? createPostDto.Location.Substring(0, Math.Min(createPostDto.Location.Length, 90)) : null,  // limit 90 chars cho an toàn xíu
                AuthorId = userId,
                GroupId = createPostDto.GroupId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            // Notify Google Indexing
            var baseUrl = _config["ProductionURL"] ?? "https://blogsocial.io.vn";
            if (!baseUrl.EndsWith("/")) baseUrl += "/";
            _ = _googleIndexingService.NotifyUrlUpdated($"{baseUrl}post/{post.Slug}");

            // Reload to get author and group info
            await _context.Entry(post).Reference(p => p.Author).LoadAsync();
            if (post.GroupId.HasValue)
            {
                await _context.Entry(post).Reference(p => p.Group).LoadAsync();
            }

            return CreatedAtAction(nameof(GetPost), new { id = post.Id }, new PostDto
            {
                Id = post.Id,
                Title = post.Title,
                Slug = post.Slug,
                Content = post.Content,
                ImageUrl = post.ImageUrl,
                Location = post.Location,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                AuthorId = post.AuthorId,
                AuthorName = post.Author.DisplayName,
                AuthorProfilePicture = post.Author.ProfilePicture,
                AuthorcartoonCharacter = post.Author.cartoonCharacter,
                GroupId = post.GroupId,
                GroupName = post.Group?.Name,
                GroupSlug = post.Group?.Slug,
                GroupCreatorId = post.Group?.CreatorId,
                Upvotes = 0,
                Downvotes = 0,
                UserVote = 0
            });
        }

        /// Cập nhật bài viết theo Id (tiêu đề, nội dung, hình ảnh, địa điểm), chỉ tác giả hoặc Admin mới được phép
        /// Endpoint: PUT api/posts/{id}
        [HttpPut("{id}")]
        [Microsoft.AspNetCore.Http.Timeouts.RequestTimeout("UploadPolicy")]
        [RequestSizeLimit(30 * 1024 * 1024)] // limit 30MB 
        public async Task<IActionResult> UpdatePost(Guid id, [FromForm] CreatePostDto updatePostDto, CancellationToken ct = default)
        {
            var post = await _context.Posts.FindAsync(id);
            if (post == null) return NotFound();

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var isAdmin = User.IsInRole("Admin");

            if (post.AuthorId != userId && !isAdmin)
            {
                return Forbid();
            }

            string? imageUrl = updatePostDto.ImageUrl;
            if (updatePostDto.ImageFile != null)
            {
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif" };
                var extension = Path.GetExtension(updatePostDto.ImageFile.FileName).ToLower();

                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest("Chỉ chấp nhận các định dạng ảnh (.jpg, .jpeg, .png, .gif, .webp, .heic, .heif)");
                }

                if (updatePostDto.ImageFile.Length > 20 * 1024 * 1024)
                {
                    return BadRequest("Kích thước ảnh không được vượt quá 20MB.");
                }
                imageUrl = await SaveImage(updatePostDto.ImageFile);
            }

            if (post.Title != updatePostDto.Title)
            {
                post.Title = updatePostDto.Title;
                post.Slug = await GenerateUniqueSlug(updatePostDto.Title, id);
            }
            post.Content = updatePostDto.Content;
            post.ImageUrl = imageUrl;
            post.Location = updatePostDto.Location != null ? updatePostDto.Location.Substring(0, Math.Min(updatePostDto.Location.Length, 90)) : null;
            post.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Notify Google Indexing
            var baseUrl = _config["ProductionURL"] ?? "https://blogsocial.io.vn";
            if (!baseUrl.EndsWith("/")) baseUrl += "/";
            _ = _googleIndexingService.NotifyUrlUpdated($"{baseUrl}post/{post.Slug}");

            return NoContent();
        }

        private async Task<string> SaveImage(IFormFile file)
        {
            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var uploadPath = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");

            if (!Directory.Exists(uploadPath))
            {
                Directory.CreateDirectory(uploadPath);
            }

            var filePath = Path.Combine(uploadPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return "/uploads/" + fileName;
        }

        /// Xóa bài viết theo Id (tác giả, Admin hoặc người tạo nhóm đều được phép), thông báo Google Indexing xóa URL
        /// Endpoint: DELETE api/posts/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(Guid id)
        {
            var post = await _context.Posts
                .Include(p => p.Group)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null) return NotFound();

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var isAdmin = User.IsInRole("Admin");

            // Allow delete if:
            // 1. User is Author of the post
            // 2. User is Admin
            // 3. Post is in a group and User is the Creator of that group
            bool isGroupCreator = post.Group != null && post.Group.CreatorId == userId;

            if (post.AuthorId != userId && !isAdmin && !isGroupCreator)
            {
                return Forbid();
            }

            var postSlug = post.Slug;
            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();

            // Notify Google Indexing
            var baseUrl = _config["ProductionURL"] ?? "https://blogsocial.io.vn";
            if (!baseUrl.EndsWith("/")) baseUrl += "/";
            _ = _googleIndexingService.NotifyUrlDeleted($"{baseUrl}post/{postSlug}");

            return NoContent();
        }

        /// Bỏ phiếu (upvote/downvote) cho bài viết, gửi thông báo realtime qua SignalR khi upvote
        /// Endpoint: POST api/posts/{id}/vote
        [Idempotent]
        [HttpPost("{id}/vote")]
        public async Task<IActionResult> VotePost(Guid id, [FromBody] VoteDto voteDto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            var userId = Guid.Parse(userIdStr);

            var post = await _context.Posts.FindAsync(id);
            if (post == null) return NotFound();

            var existingVote = await _context.PostVotes
                .FirstOrDefaultAsync(v => v.PostId == id && v.UserId == userId);

            if (existingVote != null)
            {
                if (voteDto.VoteType == 0)
                {
                    _context.PostVotes.Remove(existingVote);
                }
                else
                {
                    existingVote.VoteType = voteDto.VoteType;
                }
            }
            else
            {
                if (voteDto.VoteType != 0)
                {
                    _context.PostVotes.Add(new PostVote
                    {
                        PostId = id,
                        UserId = userId,
                        VoteType = voteDto.VoteType
                    });
                }
            }

            await _context.SaveChangesAsync();

            // Send Notification
            if (voteDto.VoteType == 1 && post.AuthorId != userId) // Only notify on upvote and if not self
            {
                var senderUser = await _context.Users.FindAsync(userId);
                if (senderUser != null)
                {
                    var notification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = post.AuthorId,
                        SenderId = userId,
                        Content = $"{senderUser.DisplayName} đã thích bài viết của bạn.",
                        Type = "Like",
                        RelatedItemId = post.Id,
                        RelatedItemSlug = post.Slug,
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false
                    };
                    
                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();

                    await _notificationHub.Clients.Group(post.AuthorId.ToString()).SendAsync("ReceiveNotification", new
                    {
                        Id = notification.Id,
                        Content = notification.Content,
                        Type = notification.Type,
                        RelatedItemId = notification.RelatedItemId,
                        RelatedItemSlug = notification.RelatedItemSlug,
                        IsRead = notification.IsRead,
                        CreatedAt = notification.CreatedAt,
                        SenderId = notification.SenderId,
                        SenderName = senderUser.DisplayName,
                        SenderProfilePicture = senderUser.ProfilePicture,
                        SendercartoonCharacter = senderUser.cartoonCharacter
                    });
                }
            }

            var upvotes = await _context.PostVotes.CountAsync(v => v.PostId == id && v.VoteType == 1);
            var downvotes = await _context.PostVotes.CountAsync(v => v.PostId == id && v.VoteType == -1);

            return Ok(new { upvotes, downvotes, userVote = voteDto.VoteType });
        }
        /// Lấy danh sách bình luận của một bài viết theo postId, sắp xếp theo thời gian mới nhất (cho phép truy cập ẩn danh)
        /// Endpoint: GET api/posts/{postId}/comments
        [AllowAnonymous]
        [HttpGet("{postId}/comments")]
        public async Task<ActionResult<IEnumerable<CommentDto>>> GetComments(Guid postId)
        {
            var comments = await _context.Comments
                .Include(c => c.Author)
                .Where(c => c.PostId == postId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    PostId = c.PostId,
                    AuthorId = c.AuthorId,
                    AuthorName = c.Author.DisplayName,
                    AuthorProfilePicture = c.Author.ProfilePicture,
                    AuthorcartoonCharacter = c.Author.cartoonCharacter,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt,
                    ParentCommentId = c.ParentCommentId
                })
                .ToListAsync();

            return comments;
        }

        /// Tạo bình luận mới hoặc trả lời bình luận, gửi thông báo realtime qua SignalR cho tác giả bài viết hoặc bình luận gốc
        /// Endpoint: POST api/posts/{postId}/comments
        [Idempotent]
        [HttpPost("{postId}/comments")]
        [EnableRateLimiting("comment")]
        public async Task<ActionResult<CommentDto>> CreateComment(Guid postId, [FromBody] CreateCommentDto createCommentDto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            var userId = Guid.Parse(userIdStr);

            var post = await _context.Posts.FindAsync(postId);
            if (post == null) return NotFound();

            var comment = new Comment
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                AuthorId = userId,
                Content = createCommentDto.Content,
                CreatedAt = DateTime.UtcNow,
                ParentCommentId = createCommentDto.ParentCommentId
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();
            
            var senderUser = await _context.Users.FindAsync(userId);

            // Notify post author or parent comment author
            Guid? notificationTargetId = post.AuthorId;
            string notificationContent = $"{senderUser?.DisplayName} đã bình luận về bài viết của bạn.";
            string notificationType = "Comment";
            Guid? relatedItemId = post.Id;
            string relatedItemSlug = post.Slug;

            if (createCommentDto.ParentCommentId.HasValue)
            {
                var parentComment = await _context.Comments.FindAsync(createCommentDto.ParentCommentId.Value);
                if (parentComment != null)
                {
                    notificationTargetId = parentComment.AuthorId;
                    notificationContent = $"{senderUser?.DisplayName} đã trả lời bình luận của bạn.";
                    notificationType = "Reply";
                    // relatedItemId = parentComment.Id;
                    relatedItemId = post.Id;
                    relatedItemSlug = post.Slug;
                }
            }

            if (notificationTargetId != userId)
            {
                if (senderUser != null)
                {
                    var notification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = notificationTargetId.Value,
                        SenderId = userId,
                        Content = notificationContent,
                        Type = notificationType,
                        RelatedItemId = relatedItemId.Value,
                        RelatedItemSlug = relatedItemSlug,
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false
                    };
                    
                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();

                    await _notificationHub.Clients.Group(notificationTargetId.ToString()!).SendAsync("ReceiveNotification", new
                    {
                        Id = notification.Id,
                        Content = notification.Content,
                        Type = notification.Type,
                        RelatedItemId = notification.RelatedItemId,
                        RelatedItemSlug = notification.RelatedItemSlug,
                        IsRead = notification.IsRead,
                        CreatedAt = notification.CreatedAt,
                        SenderId = notification.SenderId,
                        SenderName = senderUser.DisplayName,
                        SenderProfilePicture = senderUser.ProfilePicture,
                        SendercartoonCharacter = senderUser.cartoonCharacter
                    });
                }
            }

            var author = await _context.Users.FindAsync(userId);
            
            return CreatedAtAction(nameof(GetComments), new { postId = postId }, new CommentDto
            {
                Id = comment.Id,
                PostId = comment.PostId,
                AuthorId = comment.AuthorId,
                AuthorName = author!.DisplayName,
                AuthorProfilePicture = author.ProfilePicture,
                AuthorcartoonCharacter = author.cartoonCharacter,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                ParentCommentId = comment.ParentCommentId
            });
        }
        
        /// Xóa bình luận theo postId và commentId (tác giả bình luận, Admin hoặc tác giả bài viết đều được phép)
        /// Endpoint: DELETE api/posts/{postId}/comments/{commentId}
        [HttpDelete("{postId}/comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(Guid postId, Guid commentId)
        {
            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null) return NotFound();

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var isAdmin = User.IsInRole("Admin");

            // Allow delete if:
            // 1. User is Author of the comment
            // 2. User is Admin
            // 3. User is the Author of the post the comment belongs to
            var post = await _context.Posts.FindAsync(postId);
            bool isPostAuthor = post != null && post.AuthorId == userId;

            if (comment.AuthorId != userId && !isAdmin && !isPostAuthor)
            {
                return Forbid();
            }

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// Lấy chi tiết bài viết theo slug URL (cho phép truy cập ẩn danh)
        /// Endpoint: GET api/posts/slug/{slug}
        [AllowAnonymous]
        [HttpGet("slug/{slug}")]
        public async Task<ActionResult<PostDto>> GetPostBySlug(string slug)
        {
            var post = await _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Group)
                .FirstOrDefaultAsync(p => p.Slug == slug);

            if (post == null) return NotFound();

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);

            return new PostDto
            {
                Id = post.Id,
                Title = post.Title,
                Slug = post.Slug,
                Content = post.Content,
                ImageUrl = post.ImageUrl,
                Location = post.Location,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                AuthorId = post.AuthorId,
                AuthorName = post.Author.DisplayName,
                AuthorProfilePicture = post.Author.ProfilePicture,
                AuthorcartoonCharacter = post.Author.cartoonCharacter,
                GroupId = post.GroupId,
                GroupName = post.Group?.Name,
                GroupSlug = post.Group?.Slug,
                GroupCreatorId = post.Group?.CreatorId,
                Upvotes = post.Votes.Count(v => v.VoteType == 1),
                Downvotes = post.Votes.Count(v => v.VoteType == -1),
                UserVote = string.IsNullOrEmpty(userIdStr) ? 0 : post.Votes.Where(v => v.UserId == Guid.Parse(userIdStr)).Select(v => v.VoteType).FirstOrDefault()
            };
        }

        /// Tạo bài viết tự động từ n8n/automation, xác thực bằng SecretKey, đăng dưới danh nghĩa tài khoản Admin (cho phép truy cập ẩn danh)
        /// Endpoint: POST api/posts/automation
        [AllowAnonymous]
        [HttpPost("automation")]
        [EnableRateLimiting("automation")]
        public async Task<ActionResult<PostDto>> CreatePostAutomation([FromBody] AutomationPostDto automationDto)
        {
            // Kiểm tra SecretKey từ config (bạn nên thêm "Automation:SecretKey" vào appsettings.json)
            var config = (IConfiguration)HttpContext.RequestServices.GetService(typeof(IConfiguration))!;
            var validSecret = config["Automation:SecretKey"];
            
            if (string.IsNullOrEmpty(automationDto.SecretKey) || automationDto.SecretKey != validSecret)
            {
                return Unauthorized("Secret Key không hợp lệ.");
            }

            // Mặc định n8n sẽ đăng bài dưới danh nghĩa Admin hoặc một User hệ thống cụ thể
            var adminUsername = config["AdminAccount:Username"];
            var author = await _context.Users.FirstOrDefaultAsync(u => u.Username == adminUsername);
            
            if (author == null) return BadRequest("Không tìm thấy tài khoản hệ thống để thực hiện automation.");

            var post = new Post
            {
                Id = Guid.NewGuid(),
                Title = automationDto.Title,
                Slug = await GenerateUniqueSlug(automationDto.Title),
                Content = automationDto.Content,
                ImageUrl = automationDto.ImageUrl,
                Location = automationDto.Location != null ? automationDto.Location.Substring(0, Math.Min(automationDto.Location.Length, 90)) : null,
                AuthorId = author.Id,
                GroupId = automationDto.GroupId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            // Notify Google Indexing
            var baseUrl = _config["ProductionURL"] ?? "https://blogsocial.io.vn";
            if (!baseUrl.EndsWith("/")) baseUrl += "/";
            _ = _googleIndexingService.NotifyUrlUpdated($"{baseUrl}post/{post.Slug}");

            // Load info để trả về DTO đầy đủ
            await _context.Entry(post).Reference(p => p.Author).LoadAsync();
            if (post.GroupId.HasValue)
            {
                await _context.Entry(post).Reference(p => p.Group).LoadAsync();
            }

            return Ok(new PostDto
            {
                Id = post.Id,
                Title = post.Title,
                Slug = post.Slug,
                Content = post.Content,
                ImageUrl = post.ImageUrl,
                Location = post.Location,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                AuthorId = post.AuthorId,
                AuthorName = post.Author.DisplayName,
                AuthorProfilePicture = post.Author.ProfilePicture,
                AuthorcartoonCharacter = post.Author.cartoonCharacter,
                GroupId = post.GroupId,
                GroupName = post.Group?.Name,
                GroupSlug = post.Group?.Slug,
                GroupCreatorId = post.Group?.CreatorId
            });
        }

        private async Task<string> GenerateUniqueSlug(string title, Guid? excludeId = null)
        {
            var baseSlug = SlugHelper.GenerateSlug(title);
            var slug = baseSlug;
            var counter = 1;

            while (await _context.Posts.AnyAsync(p => p.Slug == slug && (excludeId == null || p.Id != excludeId)))
            {
                slug = $"{baseSlug}-{counter}";
                counter++;
            }

            return slug;
        }
    }
}
