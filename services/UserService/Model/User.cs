namespace UserService.Model
{
    public class User
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string AccountStatus { get; set; } // "0" for inactive, "1" for active
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}