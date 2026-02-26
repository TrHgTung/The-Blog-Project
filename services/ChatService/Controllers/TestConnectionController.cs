using Microsoft.AspNetCore.Mvc;

namespace ChatService.Controllers
{
    [ApiController]
    [Route("api/chatHub/[controller]")]
    public class TestConnectionController : ControllerBase
    {

        [HttpGet]
        public IActionResult Check()
        {
            return Ok(new
            {
                message = "Kết nối thành công"
            });
        }
    }
}