using Microsoft.EntityFrameworkCore;
using RecommendPostService.Model;

namespace RecommendPostService.Data
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options)
        {
        }

        public DbSet<PostTrendingValue> PostTrendingValues { get; set; }
        public DbSet<PostVote> PostVotes { get; set; }
        public DbSet<CommentPost> CommentPosts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PostTrendingValue>()
                .HasIndex(ptv => new { ptv.PostId, ptv.TrendingScore });


            modelBuilder.Entity<PostVote>()
                .HasIndex(pv => new { pv.PostId, pv.UserId });

            modelBuilder.Entity<CommentPost>()
                .HasIndex(cp => new { cp.PostId, cp.UserId });

            base.OnModelCreating(modelBuilder);
        }
    }
}
