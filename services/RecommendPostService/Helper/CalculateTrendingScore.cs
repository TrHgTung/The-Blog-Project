using RecommendPostService.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using RecommendPostService.Model;
using RecommendPostService.Services;
using TheBlog.Shared.DTOs;



namespace RecommendPostService.Helper
{
    public class CalculateTrendingScore
    {
        private readonly DataContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IRedisCacheService _cacheService;

        public CalculateTrendingScore(DataContext context, IHttpClientFactory httpClientFactory, IRedisCacheService cacheService)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _cacheService = cacheService;
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
        public async Task CalculateTrendingValueForAPost(Guid postId)
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

            var trendingScore = (float)((upvoteCount - downvoteCount) + (commentCount / 1.5));

            var checkTrendingValueRecordIsExistOrNot = await _context.PostTrendingValues

                .Where(trend => trend.PostId == postId)
                .FirstOrDefaultAsync();

            if (checkTrendingValueRecordIsExistOrNot != null)
            {
                checkTrendingValueRecordIsExistOrNot.TrendingScore = trendingScore;
                _context.PostTrendingValues.Update(checkTrendingValueRecordIsExistOrNot);
                await _context.SaveChangesAsync();
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
            }

            // Cache the trending score for quick access
            await _cacheService.SetAsync($"post_trending_score_{postId}", trendingScore, TimeSpan.FromMinutes(30));
        }
    }
}