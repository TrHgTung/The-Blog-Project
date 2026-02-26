using System;
using System.ComponentModel.DataAnnotations;

namespace RecommendPostService.Model
{
    public class CommentPost
    {
        public Guid Id { get; set; }
        [Required]
        [MaxLength(256)]
        public string CommentContent { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public Guid PostId { get; set; }
        public Guid UserId { get; set; }
    }
}
