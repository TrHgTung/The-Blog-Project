using AuthService.Dto;
using Microsoft.AspNetCore.Mvc;
using AuthService.Models;
using AuthService.Data;
using Microsoft.EntityFrameworkCore;
using System.Text;
using BCrypt.Net;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AuthService.Helper;
using Microsoft.Extensions.WebEncoders.Testing;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class PingPongController : ControllerBase
    {
        // Test Postman url: http://localhost:4402/api/pingpong/
        [HttpGet]
        public IActionResult Ping()
        {
            return Ok(new { message = "Pong!" });
        }

    }
}