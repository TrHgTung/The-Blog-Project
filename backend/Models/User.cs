using System.Collections.Generic;

namespace backend.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool IsEmailVerified { get; set; } = false;
        public string? VerificationCode { get; set; }
        public DateTime? VerificationCodeExpiry { get; set; }
        public int VerificationCodeAttempts { get; set; } = 0;
        public string? ProfilePicture { get; set; }
        public string? Bio { get; set; }
        public string? cartoonCharacter { get; set; }
        public bool IsAdmin { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DateOfBirth { get; set; }
        public DateTime? TokenRevokedBefore { get; set; }

        // Navigation properties
        public ICollection<Post> Posts { get; set; } = new List<Post>();
        public ICollection<Follow> Followers { get; set; } = new List<Follow>();
        public ICollection<Follow> Following { get; set; } = new List<Follow>();
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public ICollection<GroupMember> GroupsJoined { get; set; } = new List<GroupMember>();
        public ICollection<LoginSession> LoginSessions { get; set; } = new List<LoginSession>();
    }
}
