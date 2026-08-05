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
using backend.Services;
using Microsoft.AspNetCore.RateLimiting;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    /// <summary>
    /// Description: Quản lý bài viết dạng tạp chí (Magazine)
    /// Author: tungth
    /// Create Date: 25-02-2026
    /// </summary>
    public class MagazineController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly IHubContext<NotificationHub> _notificationHub;
        private readonly IGoogleIndexingService _googleIndexingService;
        private readonly IConfiguration _config;

        public MagazineController(DataContext context, IWebHostEnvironment environment, IHubContext<NotificationHub> notificationHub,  IConfiguration config)
        {
            _context = context;
            _environment = environment;
            _notificationHub = notificationHub;
            // _googleIndexingService = googleIndexingService;
            _config = config;
        }

        /// Lấy danh sách tạp chí có phân trang, sắp xếp theo ngày tạo mới nhất (cho phép truy cập ẩn danh)
        /// Endpoint: GET api/magazine
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MagazineDto>>> GetMagazines([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var magazines = await _context.Magazines
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(m => new MagazineDto
                {
                    Id = m.Id,
                    MagazineName = m.MagazineName,
                    Slug = m.Slug,
                    CoverImage = m.CoverImage,
                    CreatedAt = m.CreatedAt,
                    AuthorId = m.AuthorId,
                    AuthorName = m.AuthorName
                })
                .ToListAsync();

            return magazines;
        }

        /// Lấy chi tiết tạp chí theo Id, bao gồm danh sách các trang sắp xếp theo số trang (cho phép truy cập ẩn danh)
        /// Endpoint: GET api/magazine/{id}
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<MagazineDto>> GetMagazine(Guid id)
        {
            var magazine = await _context.Magazines
                .Include(m => m.Pages)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (magazine == null) return NotFound();

            var magazineDto = new MagazineDto
            {
                Id = magazine.Id,
                MagazineName = magazine.MagazineName,
                Slug = magazine.Slug,
                CoverImage = magazine.CoverImage,
                CreatedAt = magazine.CreatedAt,
                AuthorId = magazine.AuthorId,
                AuthorName = magazine.AuthorName,
                Pages = magazine.Pages.OrderBy(p => p.PageNumber).Select(p => new MagazinePageDto
                {
                    Id = p.Id,
                    MagazineId = p.MagazineId,
                    HeadlineImageUrl = p.HeadlineImageUrl,
                    PageTitle = p.PageTitle,
                    FirstParagraph = p.FirstParagraph,
                    SecondParagraph = p.SecondParagraph,
                    ThirdParagraph = p.ThirdParagraph,
                    FourthParagraph = p.FourthParagraph,
                    PageNumber = p.PageNumber,
                    CreatedAt = p.CreatedAt
                }).ToList()
            };

            return magazineDto;
        }

        /// Lấy chi tiết tạp chí theo slug URL, bao gồm danh sách các trang (cho phép truy cập ẩn danh)
        /// Endpoint: GET api/magazine/slug/{slug}
        [AllowAnonymous]
        [HttpGet("slug/{slug}")]
        public async Task<ActionResult<MagazineDto>> GetMagazineBySlug(string slug)
        {
            var magazine = await _context.Magazines
                .Include(m => m.Pages)
                .FirstOrDefaultAsync(m => m.Slug == slug);

            if (magazine == null) return NotFound();

            return new MagazineDto
            {
                Id = magazine.Id,
                MagazineName = magazine.MagazineName,
                Slug = magazine.Slug,
                CoverImage = magazine.CoverImage,
                CreatedAt = magazine.CreatedAt,
                AuthorId = magazine.AuthorId,
                AuthorName = magazine.AuthorName,
                Pages = magazine.Pages.OrderBy(p => p.PageNumber).Select(p => new MagazinePageDto
                {
                    Id = p.Id,
                    MagazineId = p.MagazineId,
                    HeadlineImageUrl = p.HeadlineImageUrl,
                    PageTitle = p.PageTitle,
                    FirstParagraph = p.FirstParagraph,
                    SecondParagraph = p.SecondParagraph,
                    ThirdParagraph = p.ThirdParagraph,
                    FourthParagraph = p.FourthParagraph,
                    PageNumber = p.PageNumber,
                    CreatedAt = p.CreatedAt
                }).ToList()
            };
        }

        /// Tạo tạp chí mới với ảnh bìa, giới hạn 1 tạp chí mỗi 72 giờ (Admin được bypass), thông báo Google Indexing
        /// Endpoint: POST api/magazine
        [Idempotent]
        [HttpPost]
         [EnableRateLimiting("resource")]
        [RequestSizeLimit(30 * 1024 * 1024)] // 30MB max
        public async Task<ActionResult<MagazineDto>> CreateMagazine([FromForm] CreateMagazineDto createMagazineDto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var user = await _context.Users.FindAsync(Guid.Parse(userIdStr));
            if (user == null) return Unauthorized();

            // Rate limit: 1 magazine per 72 hours (Admin bypasses)
            if (!user.IsAdmin)
            {
                var cooldownHours = 72;
                var lastMagazine = await _context.Magazines
                    .Where(m => m.AuthorId == user.Id)
                    .OrderByDescending(m => m.CreatedAt)
                    .FirstOrDefaultAsync();

                if (lastMagazine != null)
                {
                    var timeSinceLastCreation = DateTime.UtcNow - lastMagazine.CreatedAt;
                    if (timeSinceLastCreation.TotalHours < cooldownHours)
                    {
                        var remainingTime = TimeSpan.FromHours(cooldownHours) - timeSinceLastCreation;
                        return StatusCode(429, new
                        {
                            message = $"Bạn chỉ có thể tạo 1 tạp chí mỗi {cooldownHours} giờ. Vui lòng thử lại sau {(int)remainingTime.TotalHours} giờ {remainingTime.Minutes} phút.",
                            remainingSeconds = (int)remainingTime.TotalSeconds,
                            nextAvailableAt = lastMagazine.CreatedAt.AddHours(cooldownHours)
                        });
                    }
                }
            }

            string imageUrl = createMagazineDto.CoverImage ?? string.Empty;

            if (createMagazineDto.ImageFile != null)
            {
                imageUrl = await SaveImage(createMagazineDto.ImageFile);
            }

            var magazine = new Magazine
            {
                Id = Guid.NewGuid(),
                MagazineName = createMagazineDto.MagazineName,
                Slug = await GenerateUniqueSlug(createMagazineDto.MagazineName),
                CoverImage = imageUrl,
                AuthorId = user.Id,
                AuthorName = user.DisplayName,
                CreatedAt = DateTime.UtcNow
            };

            _context.Magazines.Add(magazine);
            await _context.SaveChangesAsync();

            // Notify Google Indexing
            var baseUrl = _config["ProductionURL"] ?? "https://blogsocial.io.vn";
            if (!baseUrl.EndsWith("/")) baseUrl += "/";
            // _ = _googleIndexingService.NotifyUrlUpdated($"{baseUrl}magazine/{magazine.Slug}");

            return CreatedAtAction(nameof(GetMagazine), new { id = magazine.Id }, new MagazineDto
            {
                Id = magazine.Id,
                MagazineName = magazine.MagazineName,
                Slug = magazine.Slug,
                CoverImage = magazine.CoverImage,
                CreatedAt = magazine.CreatedAt,
                AuthorId = magazine.AuthorId,
                AuthorName = magazine.AuthorName
            });
        }

        /// Thêm trang mới vào tạp chí (tối đa 10 trang), chỉ tác giả tạp chí mới được phép
        /// Endpoint: POST api/magazine/{magazineId}/pages
        [Idempotent]
        [HttpPost("{magazineId}/pages")]
        [EnableRateLimiting("resource")]
        public async Task<ActionResult<MagazinePageDto>> AddPage(Guid magazineId, [FromForm] CreateMagazinePageDto createPageDto)
        {
            var magazine = await _context.Magazines.FindAsync(magazineId);
            if (magazine == null) return NotFound();

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (magazine.AuthorId != userId) return Forbid();

            var pageCount = await _context.MagazinePages.CountAsync(p => p.MagazineId == magazineId);
            if (pageCount >= 10) return BadRequest(new { message = "Mỗi tạp chí chỉ được tạo tối đa 10 trang." });

            string imageUrl = createPageDto.HeadlineImageUrl;
            if (createPageDto.ImageFile != null)
            {
                imageUrl = await SaveImage(createPageDto.ImageFile);
            }

            var page = new MagazinePage
            {
                Id = Guid.NewGuid(),
                MagazineId = magazineId,
                HeadlineImageUrl = imageUrl,
                PageTitle = createPageDto.PageTitle,
                FirstParagraph = createPageDto.FirstParagraph,
                SecondParagraph = createPageDto.SecondParagraph,
                ThirdParagraph = createPageDto.ThirdParagraph,
                FourthParagraph = createPageDto.FourthParagraph,
                PageNumber = createPageDto.PageNumber,
                CreatedAt = DateTime.UtcNow
            };

            _context.MagazinePages.Add(page);
            await _context.SaveChangesAsync();

            return Ok(new MagazinePageDto
            {
                Id = page.Id,
                MagazineId = page.MagazineId,
                HeadlineImageUrl = page.HeadlineImageUrl,
                PageTitle = page.PageTitle,
                FirstParagraph = page.FirstParagraph,
                SecondParagraph = page.SecondParagraph,
                ThirdParagraph = page.ThirdParagraph,
                FourthParagraph = page.FourthParagraph,
                PageNumber = page.PageNumber,
                CreatedAt = page.CreatedAt
            });
        }

        /// Cập nhật thông tin tạp chí (tên, ảnh bìa), chỉ tác giả hoặc Admin mới được phép
        /// Endpoint: PUT api/magazine/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMagazine(Guid id, [FromForm] CreateMagazineDto updateMagazineDto)
        {
            var magazine = await _context.Magazines.FindAsync(id);
            if (magazine == null) return NotFound();

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var isAdmin = User.IsInRole("Admin");

            if (magazine.AuthorId != userId && !isAdmin)
            {
                return Forbid();
            }

            if (magazine.MagazineName != updateMagazineDto.MagazineName)
            {
                magazine.MagazineName = updateMagazineDto.MagazineName;
                magazine.Slug = await GenerateUniqueSlug(updateMagazineDto.MagazineName, id);
            }

            if (updateMagazineDto.ImageFile != null)
            {
                magazine.CoverImage = await SaveImage(updateMagazineDto.ImageFile);
            }
            else if (updateMagazineDto.CoverImage != null)
            {
                magazine.CoverImage = updateMagazineDto.CoverImage;
            }

            await _context.SaveChangesAsync();

            // Notify Google Indexing
            var baseUrl = _config["ProductionURL"] ?? "https://blogsocial.io.vn";
            if (!baseUrl.EndsWith("/")) baseUrl += "/";
            // _ = _googleIndexingService.NotifyUrlUpdated($"{baseUrl}magazine/{magazine.Slug}");

            return NoContent();
        }

        /// Xóa tạp chí theo Id, chỉ Admin mới được phép, thông báo Google Indexing xóa URL
        /// Endpoint: DELETE api/magazine/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMagazine(Guid id)
        {
            var magazine = await _context.Magazines.FindAsync(id);
            if (magazine == null) return NotFound();

            var isAdmin = User.IsInRole("Admin");

            // Only Admin can delete magazines
            if (!isAdmin)
            {
                return Forbid();
            }

            var slug = magazine.Slug;
            _context.Magazines.Remove(magazine);
            await _context.SaveChangesAsync();

            // Notify Google Indexing
            var baseUrl = _config["ProductionURL"] ?? "https://blogsocial.io.vn";
            if (!baseUrl.EndsWith("/")) baseUrl += "/";
            // _ = _googleIndexingService.NotifyUrlDeleted($"{baseUrl}magazine/{slug}");

            return NoContent();
        }

        /// Cập nhật nội dung một trang tạp chí theo pageId (chỉ tác giả tạp chí)
        /// Endpoint: PUT api/magazine/pages/{pageId}
        [HttpPut("pages/{pageId}")]
        public async Task<IActionResult> UpdatePage(Guid pageId, [FromForm] CreateMagazinePageDto updatePageDto)
        {
            var page = await _context.MagazinePages
                .Include(p => p.Magazine)
                .FirstOrDefaultAsync(p => p.Id == pageId);

            if (page == null) return NotFound();

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (page.Magazine.AuthorId != userId) return Forbid();

            if (updatePageDto.ImageFile != null)
            {
                page.HeadlineImageUrl = await SaveImage(updatePageDto.ImageFile);
            }
            else
            {
                page.HeadlineImageUrl = updatePageDto.HeadlineImageUrl;
            }

            page.PageTitle = updatePageDto.PageTitle;
            page.FirstParagraph = updatePageDto.FirstParagraph;
            page.SecondParagraph = updatePageDto.SecondParagraph;
            page.ThirdParagraph = updatePageDto.ThirdParagraph;
            page.FourthParagraph = updatePageDto.FourthParagraph;
            page.PageNumber = updatePageDto.PageNumber;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// Xóa một trang tạp chí theo pageId (chỉ tác giả tạp chí)
        /// Endpoint: DELETE api/magazine/pages/{pageId}
        [HttpDelete("pages/{pageId}")]
        public async Task<IActionResult> DeletePage(Guid pageId)
        {
            var page = await _context.MagazinePages
                .Include(p => p.Magazine)
                .FirstOrDefaultAsync(p => p.Id == pageId);

            if (page == null) return NotFound();

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (page.Magazine.AuthorId != userId) return Forbid();

            _context.MagazinePages.Remove(page);
            await _context.SaveChangesAsync();
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

        private async Task<string> GenerateUniqueSlug(string title, Guid? excludeId = null)
        {
            var baseSlug = SlugHelper.GenerateSlug(title);
            var slug = baseSlug;
            var counter = 1;

            while (await _context.Magazines.AnyAsync(m => m.Slug == slug && (excludeId == null || m.Id != excludeId)))
            {
                slug = $"{baseSlug}-{counter}";
                counter++;
            }

            return slug;
        }
    }
}

