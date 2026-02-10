namespace UserService.Dto
{
    public class PostDto
    {
        public Guid Id { get; set; }
        public string PostTitle { get; set; }
        public string PostContent { get; set; }
        public string HeroImage { get; set; }
        public string BackgroundColor { get; set; }
        public Guid TopicId { get; set; } // the topic of the post
        public Guid UserId { get; set; } // the owner of the post
        public bool IsActive { get; set; } = true; // true = active post, false = deleted post (soft delete)
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}