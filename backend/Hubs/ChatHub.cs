using Microsoft.AspNetCore.SignalR;
using backend.Data;
using backend.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace backend.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly DataContext _context;
        private readonly IHubContext<NotificationHub> _notificationHub;

        public ChatHub(DataContext context, IHubContext<NotificationHub> notificationHub)
        {
            _context = context;
            _notificationHub = notificationHub;
        }

        public async Task SendMessage(Guid receiverId, string message)
        {
            var senderId = Guid.Parse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)!);
            
            // Check if sender follows receiver
            var isFollowing = await _context.Follows.AnyAsync(f => f.FollowerId == senderId && f.FollowingId == receiverId);
            if (!isFollowing)
            {
                throw new HubException("Bạn phải follow người này để có thể gửi tin nhắn.");
            }

            var chatMessage = new ChatMessage
            {
                Id = Guid.NewGuid(),
                SenderId = senderId,
                ReceiverId = receiverId,
                Message = message,
                SentAt = DateTime.UtcNow
            };

            _context.ChatMessages.Add(chatMessage);
            await _context.SaveChangesAsync();

            // Send to receiver
            await Clients.User(receiverId.ToString()).SendAsync("ReceiveMessage", new
            {
                chatMessage.Id,
                chatMessage.SenderId,
                chatMessage.ReceiverId,
                chatMessage.Message,
                chatMessage.SentAt
            });

            // Send back to sender (for multi-device sync)
            await Clients.Caller.SendAsync("ReceiveMessage", new
            {
                chatMessage.Id,
                chatMessage.SenderId,
                chatMessage.ReceiverId,
                chatMessage.Message,
                chatMessage.SentAt
            });

            // Trigger Notification
            var senderUser = await _context.Users.FindAsync(senderId);
            if (senderUser != null)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = receiverId,
                    SenderId = senderId,
                    Content = $"{senderUser.DisplayName} đã gửi một tin nhắn cho bạn.",
                    Type = "Message",
                    RelatedItemId = chatMessage.Id,
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };
                
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                await _notificationHub.Clients.Group(receiverId.ToString()).SendAsync("ReceiveNotification", new
                {
                    Id = notification.Id,
                    Content = notification.Content,
                    Type = notification.Type,
                    RelatedItemId = notification.RelatedItemId,
                    IsRead = notification.IsRead,
                    CreatedAt = notification.CreatedAt,
                    SenderId = notification.SenderId,
                    SenderName = senderUser.DisplayName,
                    SenderProfilePicture = senderUser.ProfilePicture,
                    SendercartoonCharacter = senderUser.cartoonCharacter
                });
            }
        }

        public override async Task OnConnectedAsync()
        {
            // Optional: Mark messages as read when connected?
            await base.OnConnectedAsync();
        }
    }
}
