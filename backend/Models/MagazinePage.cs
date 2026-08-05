namespace backend.Models
{
    using System.ComponentModel.DataAnnotations;

    public class MagazinePage
    {
        public Guid Id { get; set; }
        public Guid MagazineId { get; set; }
        [MaxLength(256)]
        public string? HeadlineImageUrl { get; set; }
        
        [Required]
        [MaxLength(256)]
        public string PageTitle { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? FirstParagraph { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? SecondParagraph { get; set; }

        [MaxLength(1000)]
        public string? ThirdParagraph { get; set; }

        [MaxLength(1000)]
        public string? FourthParagraph { get; set; }
        public int PageNumber { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // 1 page must belong to only 1 magazine
        public Magazine Magazine { get; set; } = null!;
    }
}