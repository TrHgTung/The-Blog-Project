namespace AuthService.Models
{
    public class PasswordRecovery
    {
        public Guid Id { get; set; }
        public string UserEmail { get; set; }
        public string RecoveryCode { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UsedAt { get; set; } = null;
    }
}