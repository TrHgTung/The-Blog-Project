using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuthService.Dto;
using AuthService.Models;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Helper
{
    public static class TokenHelper
    {
        public static TokenResponseDto GenerateToken(User user, IConfiguration configuration)
        {
            // phần xử lý access tokén
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(configuration["Jwt:Key"]);

            var accessTokenDscriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, "User")
                }),
                Expires = DateTime.UtcNow.AddMinutes(30),
                Issuer = configuration["Jwt:Issuer"],
                Audience = configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var accessToken = tokenHandler.CreateToken(accessTokenDscriptor);

            // phần xử lý refresh token
            var refreshToken = Guid.NewGuid().ToString();
            return new TokenResponseDto
            {
                AccessToken = tokenHandler.WriteToken(accessToken),
                AccessTokenExpiresAt = accessTokenDscriptor.Expires.Value,

                RefreshToken = refreshToken,
                RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7) // refresh token có hạn trong 7 ngày
            };
        }
    }
}