using Microsoft.AspNetCore.Mvc;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/auth-service/[controller]")]
    public class TestConnectionController : ControllerBase
    {

        [HttpGet()]
        public async Task<IActionResult> GetCheckpointById()
        {
            return Ok(new
            {
                message = "Kết nối thành công"
            });
        }
    }
}