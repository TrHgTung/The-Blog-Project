using System.ComponentModel.DataAnnotations;

namespace TheBlog.Shared.DTOs
{
    public class CommentDto
    {
        [Required]
        [MaxLength(256)]
        public string CommentContent { get; set; }
    }

    public class ReplyCmtDto
    {
        [Required]
        [MaxLength(256)]
        public string ReplyContent { get; set; }
    }
}