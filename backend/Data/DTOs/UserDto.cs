using System.ComponentModel.DataAnnotations;
using backend.Utilities;

namespace backend.Data.DTOs
{
    public class UserRegisterDto
    {
        [Required]
        [StringLength(20, MinimumLength = 3)]
        [RegularExpression("^[a-zA-Z0-9]+$", ErrorMessage = "Tên đăng nhập chỉ được chứa chữ cái tiếng Anh và số, không chứa ký tự đặc biệt hay emoji.")]
        [NotProfane(ErrorMessage = "Tên đăng nhập chứa từ ngữ không hợp lệ.")]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [StringLength(32, MinimumLength = 6)]
        [RegularExpression("^[a-zA-Z0-9@#]+$", ErrorMessage = "Mật khẩu chỉ được chứa chữ cái tiếng Anh, số và các ký tự (@, #).")]
        public string Password { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [NotProfane(ErrorMessage = "Tên hiển thị chứa từ ngữ không hợp lệ.")]
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>reCAPTCHA v2 token từ frontend (bắt buộc để verify server-side)</summary>
        [Required]
        public string CaptchaToken { get; set; } = string.Empty;
    }

    public class UserLoginDto
    {
        [Required]
        [MaxLength(20)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(32)]
        public string Password { get; set; } = string.Empty;

        /// <summary>reCAPTCHA v2 token từ frontend (bắt buộc để verify server-side)</summary>
        [Required]
        public string CaptchaToken { get; set; } = string.Empty;
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? ProfilePicture { get; set; }
        public string? Bio { get; set; }
        public bool IsAdmin { get; set; }
        public string Token { get; set; } = string.Empty;
        public string? SessionId { get; set; }
        public string cartoonCharacter {get; set;}
        public DateTime? DateOfBirth { get; set; }
    }

    public class UserUpdateDto
    {
        [MaxLength(50)]
        [NotProfane(ErrorMessage = "Tên hiển thị chứa từ ngữ không hợp lệ.")]
        public string DisplayName { get; set; } = string.Empty;
        public string? ProfilePicture { get; set; }
        [MaxLength(200)]
        [NotProfane(ErrorMessage = "Tiểu sử chứa từ ngữ không hợp lệ.")]
        public string? Bio { get; set; }
        public string? cartoonCharacter { get; set; }
        public DateTime? DateOfBirth { get; set; }
    }

    public class VerifyEmailDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string VerificationCode { get; set; } = string.Empty;
    }

    public class ForgotPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class VerifyResetPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string VerificationCode { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string VerificationCode { get; set; } = string.Empty;

        [Required]
        [StringLength(32, MinimumLength = 6)]
        [RegularExpression("^[a-zA-Z0-9@#]+$", ErrorMessage = "Mật khẩu mới chỉ được chứa chữ cái tiếng Anh, số và các ký tự (@, #).")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
