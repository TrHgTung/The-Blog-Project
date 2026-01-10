using System.ComponentModel.DataAnnotations;
namespace AuthService.Dto
{
    public class RefreshTokenDto
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}