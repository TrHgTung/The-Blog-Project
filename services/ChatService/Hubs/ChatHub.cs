using Microsoft.AspNetCore.SignalR;
using ChatService.Helper;
using ChatService.Models;

namespace ChatService.Hubs
{
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
            if (string.IsNullOrEmpty(senderId) || string.IsNullOrEmpty(receiverId)) return;

            var chat = new ChatMsg
            {
                Id = Guid.NewGuid(),
                SenderId = Guid.Parse(senderId),
                ReceiverId = Guid.Parse(receiverId),
                Content = message,
                CreatedAt = DateTime.UtcNow
            };

            _storage.SaveMessage(chat);

            await Clients.User(receiverId)
                .SendAsync("ReceiveMessage", senderId, message);
        }

        public override async Task OnConnectedAsync()
        {
            Console.WriteLine($"User connected: {Context.UserIdentifier}");
            await base.OnConnectedAsync();
        }
    }
}