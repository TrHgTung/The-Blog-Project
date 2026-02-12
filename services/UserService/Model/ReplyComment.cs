using System.ComponentModel.DataAnnotations;

namespace UserService.Model
{
    // model reply of a cmt
    public class ReplyComment
    {
        public Guid Id { get; set; }
        public Guid CommentPostId { get; set; } // the post being commented on
        public Guid UserId { get; set; } // the user who made the comment
        [Required]
        [MaxLength(256)]
        public string ReplyCmtContent { get; set; }
        public bool IsActive { get; set; } = true; // true = active, false = deleted
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}