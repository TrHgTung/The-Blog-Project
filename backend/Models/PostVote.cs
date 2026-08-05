namespace backend.Models
{
    public class PostVote
    {
        public Guid PostId { get; set; }
        public Post Post { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        // 1 for Upvote, -1 for Downvote
        public int VoteType { get; set; } 
    }
}
