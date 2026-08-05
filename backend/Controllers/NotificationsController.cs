using System.Security.Claims;
using backend.Data;
using backend.Data.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    /// <summary>
    /// Description: Quản lý hệ thống thông báo cho người dùng
    /// Author: tungth
    /// Create Date: 16-01-2026
    /// </summary>
    public class NotificationsController : ControllerBase
    {
        private readonly DataContext _context;

        public NotificationsController(DataContext context)
        {
            _context = context;
        }

        /// Lấy danh sách tất cả thông báo của user hiện tại, sắp xếp theo thời gian mới nhất
        /// Endpoint: GET api/notifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var notifications = await _context.Notifications
                .Include(n => n.Sender)
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Content = n.Content,
                    Type = n.Type,
                    RelatedItemId = n.RelatedItemId,
                    RelatedItemSlug = n.RelatedItemSlug,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    SenderId = n.SenderId,
                    SenderName = n.Sender != null ? n.Sender.DisplayName : null,
                    SenderProfilePicture = n.Sender != null ? n.Sender.ProfilePicture : null,
                    SendercartoonCharacter = n.Sender != null ? n.Sender.cartoonCharacter : null
                })
                .ToListAsync();

            return notifications;
        }

        /// Đánh dấu một thông báo là đã đọc theo Id
        /// Endpoint: PUT api/notifications/{id}/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            
            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// Đánh dấu tất cả thông báo chưa đọc của user hiện tại là đã đọc
        /// Endpoint: PUT api/notifications/read-all
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
