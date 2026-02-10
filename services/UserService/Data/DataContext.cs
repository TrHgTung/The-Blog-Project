using UserService.Model;
using Microsoft.EntityFrameworkCore;

namespace UserService.Data;

public class DataContext : DbContext
{
    public DataContext(DbContextOptions<DataContext> options)
        : base(options)
    {
    }

    public DbSet<UserPublicSocialInformation> UPSInfo { get; set; }
    public DbSet<UserFollowStatus> UFStatus { get; set; }
    public DbSet<UserRecommenationFlag> URFlags { get; set; }
    public DbSet<UserTopic> UserTopics { get; set; }
    public DbSet<TopicUserMember> TopicUserMembers { get; set; }
    public DbSet<PostTopic> PostTopics { get; set; }
    public DbSet<PostVote> PostVotes { get; set; }
}