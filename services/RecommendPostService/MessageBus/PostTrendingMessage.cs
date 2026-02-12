//model dùng để gửi message khi có post trending được tính toán lại
namespace RecommendPostService.MessageBus
{
    public class PostTrendingMessage
    {
        public Guid PostId { get; set; }
    }
}
