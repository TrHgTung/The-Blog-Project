using System.Security.Claims;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using backend.Data.DTOs;
using backend.Utilities;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    /// <summary>
    /// Description: Quản lý thông tin và hoạt động của các nhóm 
    /// Author: tungth
    /// Create Date: 14-01-2026
    /// </summary>
    public class GroupsController : ControllerBase
    {
        private readonly DataContext _context;

        public GroupsController(DataContext context)
        {
            _context = context;
        }

        private string GenerateSlug(string text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            
            // Convert to lowercase
            text = text.ToLowerInvariant();
            
            // Remove diacritics (Vietnamese marks)
            string[] vietnameseNormal = { "a", "d", "e", "i", "o", "u", "y" };
            string[] vietnameseRegex = { "[áàảãạâấầẩẫậăắằẳẵặ]", "[đ]", "[éèẻẽẹêếềểễệ]", "[íìỉĩị]", "[óòỏõọôốồổỗộơớờởỡợ]", "[úùủũụưứừửữự]", "[ýỳỷỹỵ]" };
            for (int i = 0; i < vietnameseRegex.Length; i++)
            {
                text = Regex.Replace(text, vietnameseRegex[i], vietnameseNormal[i]);
            }

            // Remove special characters and replace spaces with hyphens
            text = Regex.Replace(text, @"[^a-z0-9\s-]", "");
            text = Regex.Replace(text, @"\s+", "-").Trim('-');
            
            return text;
        }

        /// Lấy danh sách tất cả nhóm, kèm thông tin số thành viên và trạng thái tham gia của user hiện tại
        /// Endpoint: GET api/groups
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetGroups()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid? userId = userIdStr != null ? Guid.Parse(userIdStr) : null;

            return await _context.Groups
                .OrderByDescending(g => g.CreatedAt)
                .Select(g => new
                {
                    g.Id,
                    g.Name,
                    g.Slug,
                    g.Description,
                    g.ImageUrl,
                    MemberCount = g.Members.Count,
                    IsMember = userId.HasValue && g.Members.Any(m => m.UserId == userId.Value),
                    IsCreator = userId.HasValue && g.CreatorId == userId.Value
                })
                .ToListAsync();
        }

        /// Lấy chi tiết nhóm theo slug, bao gồm danh sách bài viết phân trang và thành viên có sinh nhật hôm nay
        /// Endpoint: GET api/groups/{slug}
        [HttpGet("{slug}")]
        public async Task<ActionResult<object>> GetGroupDetail(string slug, [FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid? userId = userIdStr != null ? Guid.Parse(userIdStr) : null;

            var group = await _context.Groups
                .Include(g => g.Members)
                .Select(g => new
                {
                    g.Id,
                    g.Name,
                    g.Slug,
                    g.Description,
                    g.ImageUrl,
                    g.CreatorId,
                    MemberCount = g.Members.Count,
                    IsMember = userId.HasValue && g.Members.Any(m => m.UserId == userId.Value),
                    IsCreator = userId.HasValue && g.CreatorId == userId.Value
                })
                .FirstOrDefaultAsync(g => g.Slug == slug);

            if (group == null) return NotFound();

            var today = DateTime.Today;
            var getMembersBirthday = await _context.GroupMembers
                .Where(m => m.GroupId == group.Id)
                .Join(_context.Users,
                    m => m.UserId,
                    u => u.Id,
                    (m, u) => u)
                .Where(u => u.DateOfBirth.HasValue
                    && u.DateOfBirth.Value.Month == today.Month
                    && u.DateOfBirth.Value.Day == today.Day)
                .Select(u => new {
                    u.Id,
                    u.DisplayName
                })
                .OrderBy(u => u.DisplayName)
                .Take(3)
                .ToListAsync();

            // Fetch posts for this group
            var posts = await _context.Posts
                .Where(p => p.GroupId == group.Id)
                .Include(p => p.Author)
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(p => new PostDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Content = p.Content,
                    Slug = p.Slug,
                    ImageUrl = p.ImageUrl,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    AuthorId = p.AuthorId,
                    AuthorName = p.Author.DisplayName,
                    AuthorProfilePicture = p.Author.ProfilePicture,
                    AuthorcartoonCharacter = p.Author.cartoonCharacter,
                    GroupId = p.GroupId,
                    GroupName = group.Name,
                    GroupSlug = group.Slug,
                    GroupCreatorId = group.CreatorId
                })
                .ToListAsync();

            return Ok(new { group, posts, getMembersBirthday });
        }

        /// Tạo nhóm mới, tự động sinh slug và thêm người tạo làm thành viên đầu tiên
        /// Endpoint: POST api/groups
        [Idempotent]
        [HttpPost]
        public async Task<ActionResult<object>> CreateGroup(CreateGroupDto dto)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            
            string slug = GenerateSlug(dto.Name);
            // Check if slug already exists, if so append random string
            if (await _context.Groups.AnyAsync(g => g.Slug == slug))
            {
                slug += "-" + Guid.NewGuid().ToString().Substring(0, 8);
            }

            var g = new backend.Models.Group
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Slug = slug,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                CreatorId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Groups.Add(g);
            
            // Auto join creator
            _context.GroupMembers.Add(new GroupMember
            {
                GroupId = g.Id,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            
            return Ok(new
            {
                g.Id,
                g.Name,
                g.Description,
                g.ImageUrl,
                MemberCount = 1,
                IsMember = true,
                IsCreator = true
            });
        }

        /// Tham gia nhóm theo Id (kiểm tra trùng lặp thành viên)
        /// Endpoint: POST api/groups/{id}/join
        [Idempotent]
        [HttpPost("{id}/join")]
        public async Task<IActionResult> JoinGroup(Guid id)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            
            var existingMember = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == id && m.UserId == userId);
            
            if (existingMember != null) return BadRequest("Already a member");

            _context.GroupMembers.Add(new GroupMember
            {
                GroupId = id,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok();
        }

        /// Rời khỏi nhóm theo Id
        /// Endpoint: POST api/groups/{id}/leave
        [HttpPost("{id}/leave")]
        public async Task<IActionResult> LeaveGroup(Guid id)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            
            var member = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == id && m.UserId == userId);
            
            if (member == null) return BadRequest("Not a member");

            _context.GroupMembers.Remove(member);
            await _context.SaveChangesAsync();
            return Ok();
        }
        
        /// Xóa nhóm theo Id (chỉ người tạo nhóm hoặc Admin mới được phép)
        /// Endpoint: DELETE api/groups/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGroup(Guid id)
        {
            var group = await _context.Groups.FindAsync(id);
            if (group == null) return NotFound();

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var isAdmin = User.IsInRole("Admin");

            // Only Creator or Admin can delete group
            if (group.CreatorId != userId && !isAdmin)
            {
                return Forbid();
            }

            _context.Groups.Remove(group);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
