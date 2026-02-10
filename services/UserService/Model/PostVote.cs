namespace UserService.Model
{
    // model post votes
    public class PostVote
    {
        public Guid Id { get; set; }                                            
        public Guid PostId { get; set; } // the post being voted on
        public Guid UserId { get; set; } // the user who voted - this vote can be a upvote or downvote
        public bool IsUpvote { get; set; } // true = upvote, false = downvote
        
        public DateTime CreatedAt { get; set; }
    }
}