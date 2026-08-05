using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers
{
    public class HitRequest 
    { 
        public string SessionId { get; set; } = string.Empty; 
    }

    [Route("api/[controller]")]
    [ApiController]
    /// <summary>
    /// Description: Quản lý lưu trữ trạng thái phiên hoạt động (Checkpoint)
    /// Author: tungth
    /// Create Date: 20-01-2026
    /// </summary>
    public class CheckpointController : ControllerBase
    {
        private readonly DataContext _context;

        public CheckpointController(DataContext context)
        {
            _context = context;
        }

        /// Ghi nhận lượt truy cập mới của visitor dựa trên SessionId (mỗi session chỉ đếm 1 lần)
        /// Endpoint: POST api/checkpoint/hit
        [HttpPost("hit")]
        public async Task<IActionResult> Hit([FromBody] HitRequest request)
        {
            try 
            {
                if (request == null || string.IsNullOrEmpty(request.SessionId)) 
                    return BadRequest("SessionId is required");

                // Check if this session already exists
                var exists = await _context.VisitorSessions.AnyAsync(s => s.SessionId == request.SessionId);
                if (exists) return Ok(new { message = "Session already counted" });

                var session = new VisitorSession 
                { 
                    SessionId = request.SessionId,
                    CreatedAt = DateTime.UtcNow 
                };
                
                _context.VisitorSessions.Add(session);
                await _context.SaveChangesAsync();
                
                return Ok(new { message = "New visitor recorded hehehe", sessionId = request.SessionId });
            }
            catch (Exception ex)
            {
                // Trả về lỗi chi tiết để debug
                return StatusCode(500, $"Internal Server Error: {ex.Message} | {ex.InnerException?.Message}");
            }
        }

        /// Lấy thống kê chi tiết dành cho Admin: tổng visitor, visitor hôm nay, user mới đăng ký, top 5 user mới nhất
        /// Endpoint: GET api/checkpoint/stats
        [HttpGet("stats")]
        [Authorize]
        public async Task<IActionResult> GetStats()
        {
            // Kiểm tra quyền Admin theo Role claim (do AuthService gán)
            if (!User.IsInRole("Admin")) 
            {
                return Forbid();
            }

            try 
            {
                var totalVisitorsCnt = await _context.VisitorSessions.CountAsync();
                var todayVisitorsCnt = await _context.VisitorSessions
                    .CountAsync(s => s.CreatedAt >= DateTime.UtcNow.Date);

                var todayNewUsersRegisteredCnt = await _context.Users
                    .CountAsync(s => s.CreatedAt >= DateTime.UtcNow.Date);

                var getTopFiveNewUsersReg = await _context.Users
                    .OrderByDescending(s => s.CreatedAt)
                    .Take(5)
                    .Select(s => new { s.Id, s.Username, s.Email, s.CreatedAt })
                    .ToListAsync();
                var totalUsersCnt = await _context.Users.CountAsync();

                return Ok(new { 
                    totalVisitorsCnt, 
                    todayVisitorsCnt,
                    todayNewUsersRegisteredCnt,
                    totalUsersCnt,
                    getTopFiveNewUsersReg
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        /// Lấy thống kê tổng quan công khai (dashboard): tổng visitor, visitor hôm nay, user mới, tổng user
        /// Endpoint: GET api/checkpoint/dash
        [HttpGet("dash")]
        public async Task<IActionResult> GetDash()
        {
            try 
            {
                var totalVisitorsCnt = await _context.VisitorSessions.CountAsync();
                var todayVisitorsCnt = await _context.VisitorSessions
                    .CountAsync(s => s.CreatedAt >= DateTime.UtcNow.Date);
                var todayNewUsersRegisteredCnt = await _context.Users
                    .CountAsync(s => s.CreatedAt >= DateTime.UtcNow.Date);
                var totalUsersCnt = await _context.Users.CountAsync();

                return Ok(new { 
                    totalVisitorsCnt, 
                    todayVisitorsCnt,
                    todayNewUsersRegisteredCnt,
                    totalUsersCnt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
