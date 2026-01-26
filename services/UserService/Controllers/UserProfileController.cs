namespace UserService.Controllers
{
    using System.Security.Claims;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using UserService.Data;

    [ApiController]
    [Route("api/[controller]")]
    public class UserProfileController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IConfiguration _configuration;
        public UserProfileController(DataContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // Lấy thông tin profile của người dùng từ token (source of truth)
        [HttpGet("profile")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> UserProfile()
        {
            return Ok(new
            {
                Id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                Username = User.Identity?.Name,
                Email = User.FindFirst("email")?.Value,
                Firstname = User.FindFirst("firstname")?.Value,
                Lastname = User.FindFirst("lastname")?.Value
            });
        }


    }
}