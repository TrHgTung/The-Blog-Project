using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace backend.Data.DTOs
{
    public class MagazineDto
    {
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(128)]
        public string MagazineName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(150)]
        public string Slug { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(256)]
        public string CoverImage { get; set; } = string.Empty;
        
        [Required]
        public DateTime CreatedAt { get; set; }
        
        [Required]
        public Guid AuthorId { get; set; }
        
        [Required]
        [MaxLength(128)]
        public string AuthorName { get; set; } = string.Empty;

        public List<MagazinePageDto> Pages { get; set; } = new List<MagazinePageDto>();
    }
}

