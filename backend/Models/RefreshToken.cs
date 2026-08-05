using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class RefreshToken
    {
        [Key]
        public Guid Id { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiredAt { get; set; }
        public DateTime? RevokedAt { get; set; }
        
        // Navigation properties
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public Guid? LoginSessionId { get; set; }
        public LoginSession? LoginSession { get; set; }
    }
}
