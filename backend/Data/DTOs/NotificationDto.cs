using System;

namespace backend.Data.DTOs
{
    public class NotificationDto
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public Guid? RelatedItemId { get; set; }
        public string? RelatedItemSlug { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid? SenderId { get; set; }
        public string? SenderName { get; set; }
        public string? SenderProfilePicture { get; set; }
        public string? SendercartoonCharacter { get; set; }
    }
}
