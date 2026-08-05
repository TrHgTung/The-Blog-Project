using System;
using System.Collections.Generic;

namespace backend.Models
{
    public class Post
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? Location { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Guid AuthorId { get; set; }
        public User Author { get; set; } = null!;

        public Guid? GroupId { get; set; }
        public Group? Group { get; set; }
        public ICollection<PostVote> Votes { get; set; } = new List<PostVote>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    }
}
