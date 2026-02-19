using System.Text.Json;
using ChatService.Models;

namespace ChatService.Helper
{
    public class ChatMessageStorage : IChatStorage
    {
        private readonly string _filePath;
        private static readonly object _lock = new object();

        public ChatMessageStorage()
        {
            var savedDirectory = Path.Combine(Directory.GetCurrentDirectory(), "Data");

            if (!Directory.Exists(savedDirectory))
                Directory.CreateDirectory(savedDirectory);

            _filePath = Path.Combine(savedDirectory, "msg.json");

            if (!File.Exists(_filePath))
                File.WriteAllText(_filePath, "[]");
        }

        public List<ChatMsg> GetMessages()
        {
            lock (_lock)
            {
                var jsonFile = File.ReadAllText(_filePath);
                return JsonSerializer.Deserialize<List<ChatMsg>>(jsonFile) ?? new List<ChatMsg>();
            }
        }

        public void SaveMessage(ChatMsg msg)
        {
            lock (_lock)
            {
                var messages = GetMessages();
                messages.Add(msg);

                var jsonFile = JsonSerializer.Serialize(messages);
                File.WriteAllText(_filePath, jsonFile);
            }
        }
    }
}