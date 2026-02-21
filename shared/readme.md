# Inter-service Communication Walkthrough

Tôi đã triển khai giải pháp sử dụng **Shared Class Library** để chia sẻ Model (DTO) giữa các dịch vụ và thiết lập **HttpClient** để `RecommendPostService` có thể gọi dữ liệu từ `UserService`.

## Các thay đổi chính

### 1. Tạo Project Shared DTO
Tôi đã tạo project [TheBlog.Shared](file:///d:/dev/The-Blog-Project/shared/TheBlog.Shared) để chứa các model dùng chung.
- [PostDto.cs](file:///d:/dev/The-Blog-Project/shared/TheBlog.Shared/DTOs/PostDto.cs): Model cho bài viết.
- [UserDto.cs](file:///d:/dev/The-Blog-Project/shared/TheBlog.Shared/DTOs/UserDto.cs): Model cho thông tin người dùng.

### 2. Cấu hình RecommendPostService
Để gọi request sang `UserService`, tôi đã thực hiện:
- Đăng ký `HttpClient` trong [Program.cs](file:///d:/dev/The-Blog-Project/services/RecommendPostService/Program.cs).
- Thêm cấu hình URL dịch vụ trong [appsettings.json](file:///d:/dev/The-Blog-Project/services/RecommendPostService/appsettings.json).
- Cập nhật [CalculateTrendingScore.cs](file:///d:/dev/The-Blog-Project/services/RecommendPostService/Helper/CalculateTrendingScore.cs) để minh họa cách lấy dữ liệu.

### 3. Cập nhật UserService
Tôi đã refactor `UserService` để sử dụng model từ project `Shared`:
- [PostTopicController.cs](file:///d:/dev/The-Blog-Project/services/UserService/Controllers/PostTopicController.cs) hiện đang dùng `TheBlog.Shared.DTOs`.
- Các logic validate trong [SecureValidateDto.cs](file:///d:/dev/The-Blog-Project/services/UserService/Dto/SecureValidateDto.cs) cũng đã được cập nhật.

## Cách sử dụng

Trong bất kỳ Service nào, bạn chỉ cần inject `IHttpClientFactory` và sử dụng như sau:

```csharp
public async Task<UserDto?> GetUserAsync(Guid userId)
{
    var client = _httpClientFactory.CreateClient("UserService");
    var response = await client.GetAsync($"/api/user-service/UserProfile/details/{userId}");
    
    if (response.IsSuccessStatusCode)
    {
        return await response.Content.ReadFromJsonAsync<UserDto>();
    }
    return null;
}
```

> [!TIP]
> Bạn có thể tiếp tục di chuyển các DTO khác như `CommentDto`, `TopicDto` vào project `Shared` để giữ cho hệ thống đồng nhất và dễ bảo trì.
