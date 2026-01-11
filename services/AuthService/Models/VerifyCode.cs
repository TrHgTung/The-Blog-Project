namespace AuthService.Models
{
    public class VerifyCode
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Code { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UsedAt { get; set; } = null;
    }
}