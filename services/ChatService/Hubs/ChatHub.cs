using Microsoft.AspNetCore.SignalR;
using ChatService.Helper;
using ChatService.Models;
using Microsoft.AspNetCore.Authorization;

namespace ChatService.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatStorage _storage;

        public ChatHub(IChatStorage storage)
        {
            _storage = storage;
        }

        public async Task SendPrivateMessage(string receiverId, string message)
        {
            var senderId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(senderId) || string.IsNullOrEmpty(receiverId)) 
            {
                Console.WriteLine($"[ChatHub] SendPrivateMessage BLOCKED: senderId='{senderId}', receiverId='{receiverId}'");
                return;
            }

            try 
            {
                var senderGuid = Guid.Parse(senderId);
                var receiverGuid = Guid.Parse(receiverId);

                var chat = new ChatMsg
                {
                    Id = Guid.NewGuid(),
                    SenderId = senderGuid,
                    ReceiverId = receiverGuid,
                    Content = message,
                    CreatedAt = DateTime.UtcNow
                };

                _storage.SaveMessage(chat);

                Console.WriteLine($"[ChatHub] Message saved and sending from {senderId} to {receiverId}");

                // Send to RECIPIENT
                await Clients.User(receiverId.ToLower())
                    .SendAsync("ReceiveMessage", senderId.ToLower(), message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ChatHub] Error in SendPrivateMessage: {ex.Message}");
            }
        }

        public async Task LoadChatHistory(string otherUserId)
        {
            var currentUserId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(currentUserId) || string.IsNullOrEmpty(otherUserId)) return;

            try 
            {
                var currentGuid = Guid.Parse(currentUserId);
                var otherGuid = Guid.Parse(otherUserId);

                var history = _storage.GetMessages()
                    .Where(m => (m.SenderId == currentGuid && m.ReceiverId == otherGuid) ||
                                (m.SenderId == otherGuid && m.ReceiverId == currentGuid))
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => new {
                        senderId = m.SenderId.ToString().ToLower(),
                        content = m.Content,
                        timestamp = m.CreatedAt
                    })
                    .ToList();

                Console.WriteLine($"[ChatHub] Loading {history.Count} messages for {currentUserId} with {otherUserId}");
                await Clients.Caller.SendAsync("ReceiveChatHistory", history);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ChatHub] Error in LoadChatHistory: {ex.Message}");
            }
        }

        public override async Task OnConnectedAsync()
        {
            Console.WriteLine($"User connected: {Context.UserIdentifier} (ConnectionId: {Context.ConnectionId})");
            await base.OnConnectedAsync();
        }
    }
}