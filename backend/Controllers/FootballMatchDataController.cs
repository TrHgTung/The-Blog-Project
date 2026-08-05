using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs;
using System.Globalization;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    /// <summary>
    /// Description: Quản lý dữ liệu và thông tin lịch thi đấu bóng đá
    /// Author: tungth
    /// Create Date: 19-04-2026
    /// </summary>
    public class FootballMatchDataController : ControllerBase {
        private readonly DataContext _context;
        public FootballMatchDataController(DataContext context) {
            _context = context;
        }

        /// Lấy danh sách trận đấu dành cho client (production), tự động cập nhật trạng thái trận đã diễn ra, sắp xếp theo ngày giờ và phân trang
        /// Endpoint: GET api/footballmatchdata/prod
        [HttpGet("prod")]
        public async Task<ActionResult<IEnumerable<FootballMatchData>>> GetFootballMatchDatasProd([FromQuery] int skip = 0, [FromQuery] int take = 10) {
            var now = DateTime.UtcNow.AddHours(7); // Giờ Việt Nam
            string[] formats = { "d/M/yyyy HH:mm", "dd/MM/yyyy HH:mm", "yyyy-MM-dd HH:mm" };
            try {
                // Tối ưu: Chỉ cập nhật trạng thái cho một số lượng nhỏ các trận đấu chưa diễn ra
                // Thay vì fetch toàn bộ, ta có thể giới hạn hoặc chỉ cập nhật khi cần.
                // Ở đây ta vẫn giữ logic cập nhật nhưng thực hiện nhanh hơn nếu bản ghi ít.
                var recentPendingMatches = await _context.FootballMatchDatas
                    .FromSqlRaw("SELECT * FROM FootballMatchDatas WHERE Id REGEXP '^[a-fA-F0-9]{{8}}-[a-fA-F0-9]{{4}}-[a-fA-F0-9]{{4}}-[a-fA-F0-9]{{4}}-[a-fA-F0-9]{{12}}$' AND IsOccured = 0")
                    .Take(50) 
                    .ToListAsync();

                var hasChanges = false;
                foreach (var match in recentPendingMatches) {
                    if (DateTime.TryParseExact($"{match.Date} {match.Time}", formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var matchDateTime)) {
                        if (now >= matchDateTime) {
                            match.IsOccured = true;
                            hasChanges = true;
                        }
                    }
                }

                if (hasChanges) {
                    await _context.SaveChangesAsync();
                }

                // Tối ưu: Sắp xếp và phân trang TRỰC TIẾP tại Database (IQueryable)
                // Vì Date/Time là string với format dd/MM/yyyy, ta sử dụng STR_TO_DATE của MySQL để sort chính xác.
                // Điều này giúp tránh việc Load toàn bộ bản ghi vào RAM (ToListAsync rồii mới sort).
                
                var query = _context.FootballMatchDatas.FromSqlRaw(@"
                    SELECT * FROM FootballMatchDatas 
                    WHERE Id REGEXP '^[a-fA-F0-9]{{8}}-[a-fA-F0-9]{{4}}-[a-fA-F0-9]{{4}}-[a-fA-F0-9]{{4}}-[a-fA-F0-9]{{12}}$'
                    AND COALESCE(STR_TO_DATE(Date, '%d/%m/%Y'), STR_TO_DATE(Date, '%Y-%m-%d')) > '2026-06-01'
                    ORDER BY 
                        STR_TO_DATE(CONCAT(Date, ' ', Time), '%d/%m/%Y %H:%i') DESC,
                        STR_TO_DATE(CONCAT(Date, ' ', Time), '%Y-%m-%d %H:%i') DESC 
                ");

                var pagedMatches = await query
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();

                return pagedMatches;
            } catch (Exception ex) {
                // Thay vì tự động DELETE, ta Log lỗi và trả về thông báo lỗi chi tiết
                return StatusCode(500, new { 
                    error = "Lỗi khi truy xuất dữ liệu trận đấu.",
                    message = ex.Message,
                    detail = "Có thể một số bản ghi có dữ liệu Date/Time hoặc Id không hợp lệ."
                });
            }
        }

        /// Lấy danh sách trận đấu dành cho quản trị viên, sắp xếp theo thời gian tạo và phân trang
        /// Endpoint: GET api/footballmatchdata
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FootballMatchData>>> GetFootballMatchDatas([FromQuery] int skip = 0, [FromQuery] int take = 10) {
            var now = DateTime.UtcNow.AddHours(7); // Giờ Việt Nam
            string[] formats = { "d/M/yyyy HH:mm", "dd/MM/yyyy HH:mm", "yyyy-MM-dd HH:mm" };
            try {
                // Tối ưu: Chỉ cập nhật trạng thái cho một số lượng nhỏ các trận đấu chưa diễn ra
                // Thay vì fetch toàn bộ, ta có thể giới hạn hoặc chỉ cập nhật khi cần.
                // Ở đây ta vẫn giữ logic cập nhật nhưng thực hiện nhanh hơn nếu bản ghi ít.
                var recentPendingMatches = await _context.FootballMatchDatas
                    .FromSqlRaw("SELECT * FROM FootballMatchDatas WHERE Id REGEXP '^[a-fA-F0-9]{{8}}-[a-fA-F0-9]{{4}}-[a-fA-F0-9]{{4}}-[a-fA-F0-9]{{4}}-[a-fA-F0-9]{{12}}$' AND IsOccured = 0")
                    .Take(50) 
                    .ToListAsync();

                var hasChanges = false;
                foreach (var match in recentPendingMatches) {
                    if (DateTime.TryParseExact($"{match.Date} {match.Time}", formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var matchDateTime)) {
                        if (now >= matchDateTime) {
                            match.IsOccured = true;
                            hasChanges = true;
                        }
                    }
                }

                if (hasChanges) {
                    await _context.SaveChangesAsync();
                }

                // Tối ưu: Sắp xếp và phân trang TRỰC TIẾP tại Database (IQueryable)
                // Vì Date/Time là string với format dd/MM/yyyy, ta sử dụng STR_TO_DATE của MySQL để sort chính xác.
                // Điều này giúp tránh việc Load toàn bộ bản ghi vào RAM (ToListAsync rồii mới sort).
                
                var query = _context.FootballMatchDatas.FromSqlRaw(@"
                    SELECT * FROM FootballMatchDatas 
                    WHERE Id REGEXP '^[a-fA-F0-9]{{8}}-[a-fA-F0-9]{{4}}-[a-fA-F0-9]{{4}}-[a-fA-F0-9]{{4}}-[a-fA-F0-9]{{12}}$'
                    ORDER BY TimeCreated DESC
                ");

                var pagedMatches = await query
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();

                return pagedMatches;
            } catch (Exception ex) {
                // Thay vì tự động DELETE, ta Log lỗi và trả về thông báo lỗi chi tiết
                return StatusCode(500, new { 
                    error = "Lỗi khi truy xuất dữ liệu trận đấu.",
                    message = ex.Message,
                    detail = "Có thể một số bản ghi có dữ liệu Date/Time hoặc Id không hợp lệ."
                });
            }
        }

        /// Thêm mới một trận đấu bóng đá (chỉ Admin)
        /// Endpoint: POST api/footballmatchdata
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<FootballMatchData>> AddMatch([FromBody] FootballMatchDataDto matchDto) {
            var match = new FootballMatchData {
                Id = Guid.NewGuid(),
                Team1 = matchDto.Team1,
                Team2 = matchDto.Team2,
                Time = matchDto.Time,
                Date = matchDto.Date,
                IsOccured = matchDto.IsOccured,
                ResultWinner = matchDto.ResultWinner,
                TimeCreated = DateTime.UtcNow.AddHours(7)
            };
            
            _context.FootballMatchDatas.Add(match);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetFootballMatchDatas), new { id = match.Id }, match);
        }

        /// Import hàng loạt trận đấu từ danh sách (chỉ Admin)
        /// Endpoint: POST api/footballmatchdata/import-matches
        [Authorize(Roles = "Admin")]
        [HttpPost("import-matches")]
        public async Task<ActionResult> ImportMatches([FromBody] List<FootballMatchDataDto> matchDtos) {
            var matches = matchDtos.Select(dto => new FootballMatchData {
                Id = Guid.NewGuid(),
                Team1 = dto.Team1,
                Team2 = dto.Team2,
                Time = dto.Time,
                Date = dto.Date,
                IsOccured = dto.IsOccured,
                ResultWinner = dto.ResultWinner,
                TimeCreated = DateTime.UtcNow.AddHours(7)
            }).ToList();

            _context.FootballMatchDatas.AddRange(matches);
            await _context.SaveChangesAsync();
            return StatusCode(201);
        }

        /// Cập nhật thông tin trận đấu theo Id, tự động tính lại trạng thái IsOccured (chỉ Admin)
        /// Endpoint: PUT api/footballmatchdata/{id}
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateMatch(Guid id, [FromBody] FootballMatchDataDto matchData) {
            var match = await _context.FootballMatchDatas.FindAsync(id);
            if (match == null) {
                return NotFound();
            }

            match.Team1 = matchData.Team1;
            match.Team2 = matchData.Team2;
            match.Time = matchData.Time;
            match.Date = matchData.Date;
            match.ResultWinner = matchData.ResultWinner;

            // Tự động cập nhật IsOccured dựa trên thời gian
            string[] formats = { "d/M/yyyy HH:mm", "dd/MM/yyyy HH:mm", "yyyy-MM-dd HH:mm" };
            if (DateTime.TryParseExact($"{matchData.Date} {matchData.Time}", formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var matchDateTime)) {
                match.IsOccured = DateTime.UtcNow.AddHours(7) >= matchDateTime;
            } else {
                match.IsOccured = matchData.IsOccured;
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        /// Xóa một trận đấu theo Id (chỉ Admin)
        /// Endpoint: DELETE api/footballmatchdata/delete-match/{id}
        [Authorize(Roles = "Admin")]
        [HttpDelete("delete-match/{id}")]
        public async Task<ActionResult> DeleteMatch(Guid id) {
            var match = await _context.FootballMatchDatas.FindAsync(id);
            if (match == null) {
                return NotFound();
            }
            _context.FootballMatchDatas.Remove(match);
            await _context.SaveChangesAsync();
            return Ok();
        }

        /// Cập nhật kết quả trận đấu (đội thắng) theo Id, tự động cập nhật trạng thái IsOccured (chỉ Admin)
        /// Endpoint: PUT api/footballmatchdata/update-match-result/{id}
        [Authorize(Roles = "Admin")]
        [HttpPut("update-match-result/{id}")]
        public async Task<ActionResult> UpdateMatchResult(Guid id, [FromBody] FootballMatchDataDto matchData) {
            var match = await _context.FootballMatchDatas.FindAsync(id);
            if (match == null) {
                return NotFound();
            }

            match.ResultWinner = matchData.ResultWinner;

            string[] formats = { "d/M/yyyy HH:mm", "dd/MM/yyyy HH:mm", "yyyy-MM-dd HH:mm" };
            if (DateTime.TryParseExact($"{match.Date} {match.Time}", formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var matchDateTime)) {
                match.IsOccured = DateTime.UtcNow.AddHours(7) >= matchDateTime;
            }

            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
