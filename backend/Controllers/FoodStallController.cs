using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/check-[controller]")]
    /// <summary>
    /// Description: Quản lý chức năng gợi ý món ăn (Food Stall)
    /// Author: tungth
    /// Create Date: 28-01-2026
    /// </summary>
    public class FoodStallController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IDistributedCache _cache;
        private const string CacheKeyPrefix = "FoodStalls_";

        public FoodStallController(DataContext context, IDistributedCache cache)
        {
            _context = context;
            _cache = cache;
        }

        /// Lấy danh sách quán ăn có hỗ trợ tìm kiếm, lọc theo thành phố/quận và phân trang (cache Redis 30 phút)
        /// Endpoint: GET api/check-foodstall
        [HttpGet]
        public async Task<ActionResult> GetAllFoodStallsData(
            [FromQuery] string? query = null,
            [FromQuery] string? city = null,
            [FromQuery] string? district = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var watch = System.Diagnostics.Stopwatch.StartNew();
            string cacheKey = $"{CacheKeyPrefix}{query}_{city}_{district}_{page}_{pageSize}";
            
            // 1. Thử lấy dữ liệu từ Redis Cache với Timeout ngắn (Tránh treo 10s nếu Redis lỗi)
            try 
            {
                // Sử dụng CancellationTokenSource để quy định timeout cho Redis là 500ms
                using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(500));
                var cachedData = await _cache.GetStringAsync(cacheKey, cts.Token);
                
                if (!string.IsNullOrEmpty(cachedData))
                {
                    watch.Stop();
                    Response.Headers.Add("X-Process-Time", $"{watch.ElapsedMilliseconds}ms");
                    Response.Headers.Add("X-Data-Source", "Redis");
                    var cachedFoodStalls = JsonSerializer.Deserialize<List<FoodStallData>>(cachedData);
                    return Ok(new { source = "cache", data = cachedFoodStalls });
                }
            }
            catch (Exception) 
            {
                // Nếu Redis chậm quá 500ms hoặc lỗi, tự động skip qua DB luôn
            }

            // 2. Truy vấn Database (Sử dụng AsNoTracking để tối ưu tốc độ đọc)
            var dbQuery = _context.FoodStallDatas.AsNoTracking().AsQueryable();

            if (!string.IsNullOrEmpty(query))
            {
                dbQuery = dbQuery.Where(f => f.FoodStallName.Contains(query) || (f.Dish != null && f.Dish.Contains(query)));
            }

            if (!string.IsNullOrEmpty(city))
            {
                dbQuery = dbQuery.Where(f => f.City == city);
            }

            if (!string.IsNullOrEmpty(district))
            {
                dbQuery = dbQuery.Where(f => f.District == district);
            }

            // Phân trang
            var foodStalls = await dbQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 3. Lưu vào Redis Cache (Chạy ngầm, không bắt User đợi)
            _ = Task.Run(async () => {
                try {
                    var cacheOptions = new DistributedCacheEntryOptions {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
                    };
                    await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(foodStalls), cacheOptions);
                } catch {}
            });

            watch.Stop();
            Response.Headers.Add("X-Process-Time", $"{watch.ElapsedMilliseconds}ms");
            Response.Headers.Add("X-Data-Source", "Database");

            return Ok(new { source = "database", data = foodStalls });
        }

        /// Lấy thông tin chi tiết một quán ăn theo Id (cache Redis 1 giờ)
        /// Endpoint: GET api/check-foodstall/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult> GetAFoodStallData(Guid id)
        {
            string cacheKey = $"FoodStallDetail_{id}";
            
            try
            {
                var cachedData = await _cache.GetStringAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    return Ok(JsonSerializer.Deserialize<FoodStallData>(cachedData));
                }
            }
            catch (Exception) {}

            var foodStall = await _context.FoodStallDatas.FindAsync(id);
            if (foodStall == null)
            {
                return NotFound();
            }

            try
            {
                await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(foodStall), new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
                });
            }
            catch (Exception) {}

            return Ok(foodStall);
        }
    }
}