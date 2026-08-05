using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<Follow> Follows { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }
        public DbSet<PostVote> PostVotes { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Magazine> Magazines { get; set; }
        public DbSet<MagazinePage> MagazinePages { get; set; }
        public DbSet<LoginSession> LoginSessions { get; set; }
        public DbSet<FoodStallData> FoodStallDatas { get; set; }
        public DbSet<IdempotencyRecord> IdempotencyRecords { get; set; }
        public DbSet<Score> Scores { get; set; }
        public DbSet<FootballMatchData> FootballMatchDatas { get; set; }
        public DbSet<VisitorSession> VisitorSessions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Follow relationships
            modelBuilder.Entity<Follow>()
                .HasKey(f => new { f.FollowerId, f.FollowingId });

            modelBuilder.Entity<Follow>()
                .HasOne(f => f.Follower)
                .WithMany(u => u.Following)
                .HasForeignKey(f => f.FollowerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Follow>()
                .HasOne(f => f.Following)
                .WithMany(u => u.Followers)
                .HasForeignKey(f => f.FollowingId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure GroupMember relationships
            modelBuilder.Entity<GroupMember>()
                .HasKey(gm => new { gm.GroupId, gm.UserId });

            modelBuilder.Entity<GroupMember>()
                .HasOne(gm => gm.Group)
                .WithMany(g => g.Members)
                .HasForeignKey(gm => gm.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<GroupMember>()
                .HasOne(gm => gm.User)
                .WithMany(u => u.GroupsJoined)
                .HasForeignKey(gm => gm.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Group creator relationship
            modelBuilder.Entity<Group>()
                .HasOne(g => g.Creator)
                .WithMany()
                .HasForeignKey(g => g.CreatorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure ChatMessage relationships
            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Post relationship
            modelBuilder.Entity<Post>()
                .HasOne(p => p.Author)
                .WithMany(u => u.Posts)
                .HasForeignKey(p => p.AuthorId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Post>()
                .HasOne(p => p.Group)
                .WithMany(g => g.Posts)
                .HasForeignKey(p => p.GroupId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure PostVote relationships
            modelBuilder.Entity<PostVote>()
                .HasKey(pv => new { pv.PostId, pv.UserId });

            modelBuilder.Entity<PostVote>()
                .HasOne(pv => pv.Post)
                .WithMany(p => p.Votes)
                .HasForeignKey(pv => pv.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PostVote>()
                .HasOne(pv => pv.User)
                .WithMany()
                .HasForeignKey(pv => pv.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Comment relationships
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Post)
                .WithMany(p => p.Comments)
                .HasForeignKey(c => c.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Author)
                .WithMany()
                .HasForeignKey(c => c.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Comment self-referencing relationship for replies
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentCommentId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Configure Notification relationships
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Sender)
                .WithMany()
                .HasForeignKey(n => n.SenderId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure Post Slug Unique Index
            modelBuilder.Entity<Post>()
                .HasIndex(p => p.Slug)
                .IsUnique();

            // Configure Magazine relationship
            modelBuilder.Entity<MagazinePage>()
                .HasOne(p => p.Magazine)
                .WithMany(m => m.Pages)
                .HasForeignKey(p => p.MagazineId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Magazine>()
                .HasIndex(m => m.Slug)
                .IsUnique();

            // Configure FoodStallData for Performance (Indexing & Length)
            modelBuilder.Entity<FoodStallData>(entity =>
            {
                entity.HasIndex(e => e.FoodStallName);
                entity.HasIndex(e => e.Dish);
                entity.HasIndex(e => e.District);
                entity.HasIndex(e => e.City);

                entity.Property(e => e.FoodStallName).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Dish).HasMaxLength(255);
                entity.Property(e => e.District).HasMaxLength(100);
                entity.Property(e => e.City).HasMaxLength(100).IsRequired();
                entity.Property(e => e.FullAddress).HasMaxLength(500);
                entity.Property(e => e.Ward).HasMaxLength(100);
                entity.Property(e => e.LongLat).HasMaxLength(100);
            });

            // Configure Score relationship
            modelBuilder.Entity<Score>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure FootballMatchData relationship
            modelBuilder.Entity<FootballMatchData>()
                .HasIndex(f => f.Time); 
            modelBuilder.Entity<FootballMatchData>()
                .HasIndex(f => f.Date);
            modelBuilder.Entity<FootballMatchData>()
                .HasIndex(f => f.IsOccured);
            modelBuilder.Entity<FootballMatchData>()
                .HasIndex(f => f.ResultWinner);

            // [A] Configure RefreshToken for Performance (Indexing & Column Length)
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                // Base64 of 32 bytes = 44 chars, varchar(255) is more than enough for indexing
                entity.Property(e => e.Token).HasMaxLength(255).IsRequired();
                
                // Critical: Unique index on Token for O(1) lookup (was full table scan on longtext)
                entity.HasIndex(e => e.Token).IsUnique();
                
                // Index for cleanup queries (WHERE ExpiredAt < cutoff)
                entity.HasIndex(e => e.ExpiredAt);

                // Note: UserId index already exists via FK constraint (IX_RefreshTokens_UserId)
            });

            // Force all DateTime properties to be UTC when reading from database
            var dateTimeConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
                v => v, v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            var nullableDateTimeConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime?, DateTime?>(
                v => v, v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime))
                    {
                        property.SetValueConverter(dateTimeConverter);
                    }
                    else if (property.ClrType == typeof(DateTime?))
                    {
                        property.SetValueConverter(nullableDateTimeConverter);
                    }
                }
            }
        }

    }
}
