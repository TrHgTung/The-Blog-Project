namespace UserService.Model
{
    public class UserTopic
    {
        public Guid Id { get; set; }
        public string TopicSlug { get; set; }
        public string TopicName { get; set; }
        public string TopicDescription { get; set; }
        public string TopicHashtag { get; set; } // string data {ex: hashtag1 - hashtag2 - ...}
        public string TopicBackgroundImage { get; set; }
        public string TopicBackgroundColor { get; set; }
        public Guid UserId { get; set; } // the owner of the topic
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}