using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class LoginSession
    {
        [Key]
        public Guid Id { get; set; }

        // Mật khẩu phiên nàoo (giá trị ngẫu nhiên)
        public string SessionSecret { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RevokedAt { get; set; }

        public Guid UserId { get; set; }
        
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;
        
        // Refresh token tương ứng với session nàoo (nếu muốn link)
        public string? RefreshTokenValue { get; set; }
    }
}
