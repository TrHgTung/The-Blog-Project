using System;

namespace backend.Models
{
    public class Follow
    {
        public Guid FollowerId { get; set; }
        public User Follower { get; set; } = null!;

        public Guid FollowingId { get; set; }
        public User Following { get; set; } = null!;

        public DateTime FollowedAt { get; set; } = DateTime.UtcNow;
    }
}
