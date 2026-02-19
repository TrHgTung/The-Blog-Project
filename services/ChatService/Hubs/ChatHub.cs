using Microsoft.AspNetCore.SignalR;

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

        var chat = new ChatMessage
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Message = message
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