namespace backend.Models
 {
    public class FoodStallData
    {
        public Guid Id { get; set; }
        public string FoodStallName { get; set; } //VD: Bánh mì Huỳnh Hoa
        public string? Dish { get; set; } //VD: Bánh mì
        public string? AboutFoodStall { get; set; } // VD: Khoảng giá: 15k - 25k
        public string? FullAddress { get; set; } //VD: 238 Nguyễn Tri Phương, Phường 4, Quận 10, Thành phố Hồ Chí Minh
        public string? Ward { get; set; } //VD: Phường 4
        public string? District { get; set; } //VD: Quận 10
        public string City { get; set; } //VD: Thành phố Hồ Chí Minh
        public string LongLat { get; set; } //VD: 10.762963, 106.660448
        public string? FeedbackVote { get; set; } //VD: 4.5
        public string? WorkingTime { get; set; } //VD: 6:00 AM - 10:00 PM
        public bool IsHaveSeat = true;
        public bool IsHaveCarParking = false;
    }
 }