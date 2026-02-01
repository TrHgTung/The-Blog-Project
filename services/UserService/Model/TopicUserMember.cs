namespace UserService.Model
{
    public class TopicUserMember
    {
        public Guid Id { get; set; }
        public Guid TopicId { get; set; }
        public Guid UserId { get; set; }
        public DateTime JoinedAtTime { get; set; }
    }
}