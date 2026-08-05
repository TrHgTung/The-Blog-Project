using System;
using System.Collections.Generic;

namespace backend.Models
{
    public class Group
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Guid CreatorId { get; set; }
        public User Creator { get; set; } = null!;

        public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
        public ICollection<Post> Posts { get; set; } = new List<Post>();
    }
}
