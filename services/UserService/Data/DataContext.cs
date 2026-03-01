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
    public DbSet<CommentPost> CommentPosts { get; set; }
    public DbSet<ReplyComment> ReplyComments { get; set; }
    public DbSet<PostTrendingValue> PostTrendingValues { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserPublicSocialInformation>()
            .HasIndex(u => u.UserId);

        modelBuilder.Entity<UserPublicSocialInformation>()
            .HasIndex(u => u.Username);

        modelBuilder.Entity<UserTopic>()
            .HasIndex(ut => new { ut.UserId, ut.TopicId });

        modelBuilder.Entity<TopicUserMember>()
            .HasIndex(tum => new { tum.UserId, tum.TopicId });

        modelBuilder.Entity<PostTopic>()
            .HasIndex(pt => new { pt.PostId, pt.TopicId });

        modelBuilder.Entity<CommentPost>()
            .HasIndex(cp => new { cp.PostId, cp.UserId });

        modelBuilder.Entity<ReplyComment>()
            .HasIndex(rc => new { rc.CommentId, rc.UserId });

        modelBuilder.Entity<PostVote>()
            .HasIndex(pv => new { pv.PostId, pv.UserId })
            .IsUnique();

        base.OnModelCreating(modelBuilder);
    }
}