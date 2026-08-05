using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace backend.Data.DTOs
{
    public class CreateMagazineDto
    {
        [Required]
        [MaxLength(128)]
        public string MagazineName { get; set; } = string.Empty;

        public string? CoverImage { get; set; }
        public IFormFile? ImageFile { get; set; }
    }

    // CreateMagazinePageDto actually
    public class CreateMagazinePageDto
    {
        [Required]
        public string PageTitle { get; set; } = string.Empty;

        public string? HeadlineImageUrl { get; set; } = string.Empty;
        public IFormFile? ImageFile { get; set; }

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
    }
}
