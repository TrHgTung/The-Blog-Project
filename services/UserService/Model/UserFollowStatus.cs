namespace UserService.Model
{
    public class UserFollowStatus
    {
        public Guid Id { get; set; }
        // User A follows User B
        public Guid UserIdA { get; set; }
        public Guid UserIdB { get; set; }
        public bool IsFollowing { get; set; } = true;
        public bool IsBlocked { get; set; } = false;
        public DateTime FollowAt { get; set; } = DateTime.UtcNow;
        public DateTime UnfollowAt { get; set; } = new DateTime(1980, 1, 1);
    }
}