using System.Security.Claims;
using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("chat")]
    /// <summary>
    /// Description: Quản lý tính năng trò chuyện, tin nhắn
    /// Author: tungth
    /// Create Date: 20-01-2026
    /// </summary>
    public class ChatController : ControllerBase
    {
        private readonly DataContext _context;

        public ChatController(DataContext context)
        {
            _context = context;
        }

        /// Lấy danh sách các cuộc hội thoại (người dùng đã nhắn tin) của user hiện tại
        /// Endpoint: GET api/chat/conversations
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations(CancellationToken ct)
        {
            var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Get all unique user IDs that current user has exchanged messages with
            var sentToIds = await _context.ChatMessages
                .Where(m => m.SenderId == currentUserId)
                .Select(m => m.ReceiverId)
                .Distinct()
                .ToListAsync();

            var receivedFromIds = await _context.ChatMessages
                .Where(m => m.ReceiverId == currentUserId)
                .Select(m => m.SenderId)
                .Distinct()
                .ToListAsync();

            var conversationUserIds = sentToIds.Concat(receivedFromIds).Distinct().ToList();

            // Get user details for these IDs
            var conversations = await _context.Users
                .Where(u => conversationUserIds.Contains(u.Id))
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.DisplayName,
                    u.ProfilePicture,
                    u.cartoonCharacter
                })
                .ToListAsync();

            return Ok(conversations);
        }

        /// Lấy lịch sử tin nhắn giữa user hiện tại và một người dùng khác (yêu cầu có quan hệ follow hoặc đã có tin nhắn)
        /// Endpoint: GET api/chat/{otherUserId}
        [HttpGet("{otherUserId}")]
        public async Task<IActionResult> GetChatHistory(Guid otherUserId, CancellationToken ct)
        {
            var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Relaxed check: allow if there's a following relationship OR if messages already exist
            var isFollowing = await _context.Follows.AnyAsync(f => 
                (f.FollowerId == currentUserId && f.FollowingId == otherUserId) || 
                (f.FollowerId == otherUserId && f.FollowingId == currentUserId), ct);
            
            var hasMessages = await _context.ChatMessages.AnyAsync(m => 
                (m.SenderId == currentUserId && m.ReceiverId == otherUserId) ||
                (m.SenderId == otherUserId && m.ReceiverId == currentUserId), ct);

            if (!isFollowing && !hasMessages) 
                return Forbid("You must have a relationship or existing conversation to view chat history.");

            var messages = await _context.ChatMessages
                .Where(m => (m.SenderId == currentUserId && m.ReceiverId == otherUserId) ||
                            (m.SenderId == otherUserId && m.ReceiverId == currentUserId))
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    m.Id,
                    m.SenderId,
                    m.ReceiverId,
                    m.Message,
                    m.SentAt
                })
                .ToListAsync();

            return Ok(messages);
        }
    }
}
