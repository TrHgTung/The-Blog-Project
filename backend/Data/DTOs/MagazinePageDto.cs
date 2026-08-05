using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Data.DTOs
{
    public class MagazinePageDto
    {
        public Guid Id { get; set; }
        public Guid MagazineId { get; set; }
        
        [MaxLength(256)]
        public string? HeadlineImageUrl { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(256)]
        public string PageTitle { get; set; } = string.Empty;
        [Required]
        [MaxLength(1000)]
        public string FirstParagraph { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? SecondParagraph { get; set; }

        [MaxLength(1000)]
        public string? ThirdParagraph { get; set; }

        [MaxLength(1000)]
        public string? FourthParagraph { get; set; }
        
        [Required]
        public int PageNumber { get; set; }
        
        public DateTime CreatedAt { get; set; }
    }
}
