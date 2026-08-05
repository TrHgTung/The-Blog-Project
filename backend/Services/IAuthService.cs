namespace backend.Services
{
    public interface IAuthService
    {
        string CreateToken(Models.User user, string sessionId);
        string HashPassword(string password);
        bool VerifyPassword(string password, string hashedPassword);
        Models.RefreshToken GenerateRefreshToken();
    }
}
