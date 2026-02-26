using System;

namespace RecommendPostService.Model
{
    public class PostVote
    {
        public Guid Id { get; set; }                                            
        public Guid PostId { get; set; }
        public Guid UserId { get; set; }
        public bool IsUpvote { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
