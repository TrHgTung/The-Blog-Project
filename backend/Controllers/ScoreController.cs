using System.Security.Claims;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
// using backend.Utilities;
using System.Linq;
using Microsoft.AspNetCore.RateLimiting;
using backend.Services;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    /// <summary>
    /// Description: Quản lý điểm số, mini game
    /// Author: tungth
    /// Create Date: 20-01-2026
    /// </summary>
    public class ScoreController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IConfiguration _config;

        public ScoreController(DataContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        /// Lấy bảng xếp hạng top 5 người chơi có điểm kinh nghiệm cao nhất (cho phép truy cập ẩn danh)
        /// Endpoint: GET api/score/leaderboard
        [HttpGet("leaderboard")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLeaderboard(CancellationToken ct)
        {
            var getTopTwenty = await _context.Scores
                .OrderByDescending(s => s.ExpPoint)
                .Take(5)
                .Select(s => new
                {
                    s.Id,
                    s.ExpPoint,
                    s.UpdatedAt,
                    s.UserId,
                    User = new
                    {
                        s.User.Username,
                        s.User.DisplayName,
                        s.User.ProfilePicture,
                        s.User.cartoonCharacter
                    }
                })
                .ToListAsync(ct);
            return Ok(getTopTwenty);
        }

        /// Lấy điểm số hiện tại của user đang đăng nhập
        /// Endpoint: GET api/score/my-score
        [HttpGet("my-score")]
        public async Task<IActionResult> GetMyScore(CancellationToken ct)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var getMyScore = await _context.Scores
                .Where(s => s.UserId == userId)
                .Select(s => new
                {
                    s.Id,
                    s.ExpPoint,
                    s.UpdatedAt,
                    s.UserId
                })
                .FirstOrDefaultAsync(ct);
            return Ok(getMyScore);
        }

        /// Lấy thứ hạng hiện tại của user đang đăng nhập trong bảng xếp hạng
        /// Endpoint: GET api/score/my-rank
        [HttpGet("my-rank")]
        public async Task<IActionResult> GetMyRankAtThisMoment(CancellationToken ct)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var currentExp = await _context.Scores
                .Where(s => s.UserId == userId)
                .Select(s => (int?)s.ExpPoint)
                .FirstOrDefaultAsync(ct) ?? 0;

            var getMyRankNumber = await _context.Scores
                .Where(s => s.ExpPoint > currentExp)
                .CountAsync(ct);
            return Ok(getMyRankNumber + 1);
        }

        /// Cập nhật điểm số sau khi chơi game, xác thực bằng secret key và chữ ký (signature) chống gian lận
        /// Endpoint: PUT api/score/update-score
        [Authorize]
        [HttpPut("update-score")]
        public async Task<IActionResult> UpdateScore(CancellationToken ct, [FromBody] ScoreUpdateDto request)
        {
            var secretKey = _config["GameSettings:ScoreUpdateSecret"];
            var requestSecret = Request.Headers["X-Score-Secret-Key"].ToString();

            if (string.IsNullOrEmpty(requestSecret) || requestSecret != secretKey)
            {
                return Unauthorized(new { message = $"Secret mismatch! Expected: {secretKey}, Received: {requestSecret}" });
            }

            var currentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            if (Math.Abs(currentTimestamp - request.Timestamp) > 2 * 60 * 60 * 1000)
            {
                return BadRequest(new { message = "Có lỗi xảy ra" });
            }

            var payloadStr = $"{request.GameId}:{request.Score}:{request.Timestamp}:{secretKey}";
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                var bytes = System.Text.Encoding.UTF8.GetBytes(payloadStr);
                var hash = sha256.ComputeHash(bytes);
                var expectedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();
                
                if (request.Signature != expectedSignature)
                {
                    return BadRequest(new { message = "Có lỗi xảy ra" });
                }
            }

            int finalScoreToAdd = 0;
            string gameIdUpper = request.GameId?.ToUpper() ?? "";
            
            if (gameIdUpper == "WORLDCUP")
            {
                finalScoreToAdd = 5;
            }
            else
            {
                finalScoreToAdd = request.Score;
            }

            if (finalScoreToAdd <= 0) return BadRequest(new { message = "Invalid score amount" });

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString))
            {
                return Unauthorized(new { message = "User not identified" });
            }
            var userId = Guid.Parse(userIdString);
            
            var getMyScore = await _context.Scores
                .Include(s => s.User) // Load User để lấy Username
                .Where(s => s.UserId == userId)
                .FirstOrDefaultAsync(ct);

            if (getMyScore == null)
            {
                var user = await _context.Users.FindAsync(userId);
                var newScore = new Score
                {
                    UserId = userId,
                    ExpPoint = finalScoreToAdd,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Scores.Add(newScore);
                await _context.SaveChangesAsync(ct);
                
                return Ok(new
                {
                    id = newScore.Id,
                    expPoint = newScore.ExpPoint,
                    user = new { username = user?.Username ?? "Unknown" }
                });
            }

            getMyScore.ExpPoint += finalScoreToAdd;
            getMyScore.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            return Ok(new
            {
                id = getMyScore.Id,
                expPoint = getMyScore.ExpPoint,
                user = new { username = getMyScore.User.Username }
            });
        }

    }
}