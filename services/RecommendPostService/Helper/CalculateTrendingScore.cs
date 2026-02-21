using RecommendPostService.Data;
using Microsoft.EntityFrameworkCore;
using TheBlog.Shared.DTOs;
using System.Text.Json;

namespace RecommendPostService.Helper
{
    public class CalculateTrendingScore
    {
        private readonly DataContext _context;
        private readonly IHttpClientFactory _httpClientFactory;

        public CalculateTrendingScore(DataContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }

        // Ví dụ: Cách lấy thông tin User từ UserService
        public async Task<UserDto?> GetUserFromUserService(Guid userId)
        {
            var client = _httpClientFactory.CreateClient("UserService");
            var response = await client.GetAsync($"/api/user-service/UserProfile/details/{userId}");

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<UserDto>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }

            return null;
        }

        // calculate trending value of a post
        // NOTE: BIẾN NÓ THÀNH MỘT MESSAGE BROKER ĐỂ CHẠY NỀN (SYSTEM DRIVEN), KHÔNG PHỤ THUỘC VÀO REQUEST/RESPONSE CỦA USER
        public async Task<IActionResult> CalculateTrendingValueForAPost(Guid postId)
        {
            // đếm số upvote
            var upvoteCount = await _context.PostVotes
                .AsNoTracking()
                .Where(pv => pv.PostId == postId && pv.IsUpvote)
                .CountAsync();

            // đếm số downvote
            var downvoteCount = await _context.PostVotes
                .AsNoTracking()
                .Where(pv => pv.PostId == postId && !pv.IsUpvote)
                .CountAsync();

            // đếm số comment
            var commentCount = await _context.CommentPosts
                .AsNoTracking()
                .Where(c => c.PostId == postId && c.IsActive)
                .CountAsync();

            var trendingScore = ((upvoteCount - downvoteCount) + (commentCount / 1.5));

            var checkTrendingValueRecordIsExistOrNot = await _context.PostTrendingValues
                .Where(trend => trend.PostId == postId)
                .FirstOrDefaultAsync();

            if (checkTrendingValueRecordIsExistOrNot != null)
            {
                checkTrendingValueRecordIsExistOrNot.TrendingScore = trendingScore;
                _context.PostTrendingValues.Update(checkTrendingValueRecordIsExistOrNot);
                await _context.SaveChangesAsync();

                return Ok();
            }
            else
            {
                var newTrendingValue = new PostTrendingValue
                {
                    Id = Guid.NewGuid(),
                    PostId = postId,
                    TrendingScore = trendingScore
                };
                _context.PostTrendingValues.Add(newTrendingValue);
                await _context.SaveChangesAsync();

                return Ok();
            }
        }
    }
}