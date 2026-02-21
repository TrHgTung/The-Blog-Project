using Microsoft.AspNetCore.Mvc;

namespace UserService.Controllers
{
    [ApiController]
    [Route("api/user-service/[controller]")]
    public class TestConnectionController : ControllerBase
    {

        [HttpGet]
        public async Task<IActionResult> CheckConnnection()
        {
            return Ok(new
            {
                message = "Kết nối thành công"
            });
        }
    }
}