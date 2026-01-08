using System.ComponentModel.DataAnnotations;

namespace AuthService.Dto
{
    public class UserLoginDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
    public class UserRegisterDto
    {
        [StringLength(32, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 32 characters")]
        public string Username { get; set; }
        [StringLength(64, MinimumLength = 6, ErrorMessage = "Password must be between 6 and 64 characters")]
        public string Password { get; set; }
        [EmailAddress(ErrorMessage = "Email must be a valid email address")]
        [StringLength(128, MinimumLength = 3, ErrorMessage = "Email must be between 3 and 128 characters")]
        public string Email { get; set; }
        [StringLength(32, MinimumLength = 2, ErrorMessage = "User firstname must be between 2 and 32 characters")]
        public string FirstName { get; set; }
        [StringLength(32, MinimumLength = 2, ErrorMessage = "User lastname must be between 2 and 32 characters")]
        public string LastName { get; set; }
        [StringLength(255)]
        public string? AvatarImage { get; set; }
        [StringLength(255)]
        public string? CoverImage { get; set; }
    }
    public class UserUpdateDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? AvatarImage { get; set; }
        public string? CoverImage { get; set; }
    }
    public class ChangePasswordDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public string NewUserPassword { get; set; }
    }
}