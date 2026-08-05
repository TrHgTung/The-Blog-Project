namespace backend.Models
{
    public class UserInfo
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public string Hometown { get; set; } = string.Empty;
        public string Workplace { get; set; } = string.Empty;
        public int RelationshipStatus { get; set; } = 0; // 0: Single, 1: In a relationship, 2: Married
    }
}
