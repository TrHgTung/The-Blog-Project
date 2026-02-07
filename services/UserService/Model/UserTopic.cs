namespace UserService.Model
{
    // model topics
    public class UserTopic
    {
        public Guid Id { get; set; } // topic id
        public string TopicSlug { get; set; }
        public string TopicName { get; set; }
        public string TopicDescription { get; set; }
        public string TopicHashtag { get; set; } // string data {ex: hashtag1 - hashtag2 - ...}
        public string TopicBackgroundImage { get; set; }
        public string TopicBackgroundColor { get; set; }
        public Guid UserId { get; set; } // the owner of the topic
        public bool IsActive { get; set; } = true; // true = active topic, false = deleted topic (soft delete)
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}