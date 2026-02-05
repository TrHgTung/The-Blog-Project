namespace UserService.Model
{
    // this model will store the time that user joined a topic
    public class TopicUserMember
    {
        public Guid Id { get; set; }
        public Guid TopicId { get; set; }
        public Guid UserId { get; set; }
        public DateTime JoinedAtTime { get; set; }
        public bool IsMember { get; set; } = true; // true = active member, false = not the member anymore, but can re-join 
    }
}