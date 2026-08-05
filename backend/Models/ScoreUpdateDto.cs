namespace backend.Models
{
    public class ScoreUpdateDto
    {
        public string GameId { get; set; } = string.Empty;
        public int Score { get; set; }
        public long Timestamp { get; set; }
        public string Signature { get; set; } = string.Empty;
    }
}
