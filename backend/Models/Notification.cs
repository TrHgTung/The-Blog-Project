using System;

namespace backend.Models
{
    public class Notification
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; } // The user receiving the notification
        public User User { get; set; } = null!;
        public Guid? SenderId { get; set; } // The user causing the notification
        public User? Sender { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "Message", "Like", "Comment"
        public Guid? RelatedItemId { get; set; } // PostId, MessageId, etc.
        public string? RelatedItemSlug { get; set; } // For slug-based navigation
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
