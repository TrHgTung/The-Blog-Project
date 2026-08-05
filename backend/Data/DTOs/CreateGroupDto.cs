using System.ComponentModel.DataAnnotations;

namespace backend.Data.DTOs
{
    public class CreateGroupDto
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;
        
        public string? ImageUrl { get; set; }
    }
}
