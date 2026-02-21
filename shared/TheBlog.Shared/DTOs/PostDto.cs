namespace TheBlog.Shared.DTOs
{
    public class PostDto
    {
        public Guid Id { get; set; }
        public string PostTitle { get; set; } = string.Empty;
        public string PostContent { get; set; } = string.Empty;
        public string HeroImage { get; set; } = string.Empty;
        public string BackgroundColor { get; set; } = string.Empty;
        public Guid TopicId { get; set; }
        public Guid UserId { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
