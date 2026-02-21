namespace TheBlog.Shared.DTOs
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? AvatarImage { get; set; }
        public string? Bio { get; set; }
        public string AccountStatus { get; set; } = "1";
        public Guid UserId { get; set; }
    }
}
