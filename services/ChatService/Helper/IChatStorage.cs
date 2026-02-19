using ChatService.Models;

namespace ChatService.Helper
{
    public interface IChatStorage
    {
        List<ChatMsg> GetMessages();
        void SaveMessage(ChatMsg msg);
    }
}