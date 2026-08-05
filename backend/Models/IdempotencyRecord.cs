using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class IdempotencyRecord
    {
        [Key]
        public string RequestKey { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public string ResponseBody { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
