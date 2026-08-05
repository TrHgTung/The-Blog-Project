using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using backend.Utilities;

namespace backend.Data.DTOs
{
    public class PostDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? Location { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        public Guid AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorProfilePicture { get; set; }
        public string? AuthorcartoonCharacter { get; set; }

        public Guid? GroupId { get; set; }
        public string? GroupName { get; set; }
        public string? GroupSlug { get; set; }
        public Guid? GroupCreatorId { get; set; }

        public int Upvotes { get; set; }
        public int Downvotes { get; set; }
        public int UserVote { get; set; } // 1: Up, -1: Down, 0: None
    }


    public class CreatePostDto
    {
        [Required]
        [MaxLength(100)]
        [NotProfane(ErrorMessage = "Tiêu đề bài viết chứa từ ngữ không hợp lệ.")]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(5000)]
        [NotProfane(ErrorMessage = "Nội dung bài viết chứa từ ngữ không hợp lệ.")]
        public string Content { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }

        [MaxLength(512)]
        public string? Location { get; set; }

        public IFormFile? ImageFile { get; set; }
        public Guid? GroupId { get; set; }
    }

    public class VoteDto
    {
        public int VoteType { get; set; } // 1 for upvote, -1 for downvote, 0 to remove vote
    }

    public class AutomationPostDto
    {
        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(10000)] // Thường automation nội dung dài hơn
        public string Content { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }
        public string? Location { get; set; }
        public Guid? GroupId { get; set; }
        public string? SecretKey { get; set; } // Key bảo mật riêng cho n8n
    }
}
