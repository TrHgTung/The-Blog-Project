using System.ComponentModel.DataAnnotations;

namespace UserService.Dto
{
    public class CreateTopicDto
    {
        public Guid Id { get; set; }
        public string TopicSlug { get; set; }
        [Required]
        [MaxLength(100)]
        public string TopicName { get; set; }
        [Required]
        [MaxLength(256)]
        public string TopicDescription { get; set; }
        public string TopicBackgroundImage { get; set; } = "1.png";
        public string TopicBackgroundColor { get; set; } = "system";
        [Required]
        public Guid UserId { get; set; } // the owner of the topic
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
    public class EditTopicDto
    {
        [MaxLength(100)]
        public string? TopicName { get; set; }
        [MaxLength(256)]
        public string? TopicDescription { get; set; }
        public string? TopicBackgroundImage { get; set; }
        public string? TopicBackgroundColor { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class TransferOwnerTopicDto
    {
        public Guid TopicId { get; set; }
        public Guid UserId { get; set; }  // new Owener Id
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
    // public class RemovePostFromTopicDto
    // {
    //     public Guid PostId { get; set; }
    //     public Guid TopicId { get; set; }
    //     public bool IsActive { get; set; } = false; // soft delete
    //     public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    // }
}