using System;
using System.Collections.Generic;

namespace backend.Models
{
    public class Magazine
    {
        public Guid Id { get; set; }
        public string MagazineName { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string CoverImage { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Guid AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;

        // 1 magazine can have many pages
        public ICollection<MagazinePage> Pages { get; set; } = new List<MagazinePage>();
    }
}
