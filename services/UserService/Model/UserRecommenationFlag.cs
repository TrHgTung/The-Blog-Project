namespace UserService.Model
{
    public class UserRecommenationFlag
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid TaggetFollowerId { get; set; }
        public bool IsRecommended { get; set; }
    }
}