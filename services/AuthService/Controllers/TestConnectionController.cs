using Microsoft.AspNetCore.Mvc;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/test-connection")]
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