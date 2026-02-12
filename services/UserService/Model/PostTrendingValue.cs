namespace UserService.Model
{
    public class PostTrendingValue
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public float TrendingScore { get; set; }
    }
}