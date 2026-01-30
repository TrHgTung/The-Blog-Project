using UserService.Model;
using Microsoft.EntityFrameworkCore;

namespace UserService.Data;

public class DataContext : DbContext
{
    public DataContext(DbContextOptions<DataContext> options)
        : base(options)
    {
    }

    public DbSet<InteractiveUser> IUsers { get; set; }
    public DbSet<UserFollowStatus> UFStatus { get; set; }
    public DbSet<UserRecommenationFlag> URFlags { get; set; }
}