using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using System.Text;
using System.Xml;

namespace backend.Controllers
{
    [ApiController]
    [Route("sitemap.xml")]
    /// <summary>
    /// Description: Tạo và quản lý Sitemap cho bộ máy tìm kiếm
    /// Author: tungth
    /// Create Date: 26-01-2026
    /// </summary>
    public class SitemapController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IConfiguration _config;

        public SitemapController(DataContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        /// Tạo file sitemap.xml động chứa tất cả URL của bài viết, tạp chí, nhóm và các trang tĩnh cho SEO
        /// Endpoint: GET sitemap.xml
        [HttpGet]
        public async Task<IActionResult> GetSitemap(CancellationToken ct)
        {
            var baseUrl = _config["ProductionURL"] ?? "https://blogsocial.io.vn";
            if (!baseUrl.EndsWith("/")) baseUrl += "/";

            var posts = await _context.Posts
                .Where(p => p.Slug != null && p.Slug != "")
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new { p.Slug, p.UpdatedAt, p.CreatedAt })
                .ToListAsync(ct);

            var magazines = await _context.Magazines
                .Where(m => m.Slug != null && m.Slug != "")
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => new { m.Slug, m.CreatedAt })
                .ToListAsync(ct);

            var groups = await _context.Groups
                .Where(g => g.Slug != null && g.Slug != "")
                .Select(g => new { g.Slug, g.CreatedAt })
                .ToListAsync(ct);

            var sb = new StringBuilder();
            sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            sb.AppendLine("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");

            // Static pages
            AddUrl(sb, baseUrl, "daily", "1.0");
            AddUrl(sb, $"{baseUrl}login", "monthly", "0.8");
            AddUrl(sb, $"{baseUrl}register", "monthly", "0.8");
            AddUrl(sb, $"{baseUrl}groups", "daily", "0.9");
            AddUrl(sb, $"{baseUrl}magazine", "daily", "0.9");
            AddUrl(sb, $"{baseUrl}landing-page", "monthly", "0.9");
            AddUrl(sb, $"{baseUrl}about", "monthly", "0.6");
            AddUrl(sb, $"{baseUrl}search", "weekly", "0.7");

            // Groups
            foreach (var group in groups)
            {
                var groupLastMod = group.CreatedAt.ToString("yyyy-MM-dd");
                AddUrl(sb, $"{baseUrl}groups/{group.Slug}", "weekly", "0.7", groupLastMod);
            }

            // Magazines
            foreach (var magazine in magazines)
            {
                var date = magazine.CreatedAt;
                var lastMod = date.ToString("yyyy-MM-dd");
                AddUrl(sb, $"{baseUrl}magazine/{magazine.Slug}", "weekly", "0.7", lastMod);
            }

            // Posts
            foreach (var post in posts)
            {
                var date = post.UpdatedAt != default ? post.UpdatedAt : post.CreatedAt;
                var lastMod = date.ToString("yyyy-MM-dd");
                AddUrl(sb, $"{baseUrl}post/{post.Slug}", "monthly", "0.6", lastMod);
            }


            sb.AppendLine("</urlset>");

            return Content(sb.ToString(), "application/xml", Encoding.UTF8);
        }

        private void AddUrl(StringBuilder sb, string url, string changeFreq, string priority, string? lastMod = null)
        {
            sb.AppendLine("  <url>");
            sb.AppendLine($"    <loc>{url}</loc>");
            if (!string.IsNullOrEmpty(lastMod))
            {
                sb.AppendLine($"    <lastmod>{lastMod}</lastmod>");
            }
            sb.AppendLine($"    <changefreq>{changeFreq}</changefreq>");
            sb.AppendLine($"    <priority>{priority}</priority>");
            sb.AppendLine("  </url>");
        }
    }
}
