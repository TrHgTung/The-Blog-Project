namespace UserService.Model
{
    public class UserPublicSocialInformation
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? AvatarImage { get; set; }
        public string? CoverImage { get; set; }
        public string? Bio { get; set; }
        public string? CurrentCity { get; set; }
        public string? Hometown { get; set; }
        public string? Workplace { get; set; }
        public string? Education { get; set; }
        public string Gender { get; set; } = "Unknown";
        public string RelationshipStatus { get; set; } = "No";
        public string? FavoriteCharacter { get; set; }
        public DateTime DateOfBirth { get; set; } = new DateTime(1980, 1, 1);
        public string AccountStatus { get; set; } = "1"; // "0" for inactive, "1" for active

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public Guid UserId { get; set; }
        // public Guid? JoinedTopicId { get; set; } // lấy từ bảng UserTopic : bảng Id (Guid)
    }
}