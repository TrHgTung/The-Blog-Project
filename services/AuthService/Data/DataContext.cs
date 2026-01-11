using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data;

public class DataContext : DbContext
{
    public DataContext(DbContextOptions<DataContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<VerifyCode> VerifyCodes { get; set; }
}