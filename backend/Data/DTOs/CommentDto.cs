using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Data.DTOs
{
    public class CommentDto
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public Guid AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorProfilePicture { get; set; }
        public string? AuthorcartoonCharacter { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public Guid? ParentCommentId { get; set; }
    }

    public class CreateCommentDto 
    {
        [Required]
        [MaxLength(500)]
        public string Content { get; set; } = string.Empty;

        public Guid? ParentCommentId { get; set; }
    }
}
