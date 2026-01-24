using Microsoft.AspNetCore.Mvc;

namespace UserService.Controllers
{
    [ApiController]
    [Route("api/user-service/[controller]")]
    public class UserPersonalInformationController : ControllerBase
    {

        [HttpGet()]
        public async Task<IActionResult> GetCurrentUserInfo()
        {
            return Ok(new
            {
                message = "User Personal Information Service is running"
            });
        }
    }
}