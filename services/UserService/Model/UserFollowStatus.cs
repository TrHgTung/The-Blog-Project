namespace UserService.Model
{
    public class UserFollowStatus
    {
        public Guid Id { get; set; }
        public string UsernameMatchA { get; set; }
        public string UsernameMatchB { get; set; }
        public DateTime FollowAt { get; set; } = DateTime.UtcNow;
        public DateTime UnfollowAt { get; set; } = new DateTime(1980, 1, 1);

        public Guid UserIdA { get; set; }
        public Guid UserIdB { get; set; }
    }
}