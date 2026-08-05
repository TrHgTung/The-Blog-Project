using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class VisitorSession
    {
        [Key]
        [Required]
        [MaxLength(50)]
        public string SessionId { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
