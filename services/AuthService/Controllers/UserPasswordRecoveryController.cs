using Microsoft.AspNetCore.Mvc;
using AuthService.Data;
using AuthService.Dto;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;
using AuthService.Helper.EmailSender;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/auth-service/[controller]")]
    public class UserPasswordRecoveryController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly DataContext _context;
        private readonly IEmailSender _emailSender;

        public UserPasswordRecoveryController(IConfiguration configuration, DataContext context, IEmailSender emailSender)
        {
            _configuration = configuration;
            _context = context;
            _emailSender = emailSender;
        }
        [HttpPost]
        [Route("send-password-recovery-code")]
        public async Task<IActionResult> SendPasswordRecoveryCode([FromBody] PasswordRecoveryRequestingDto request)
        {
            var getUserWithEmailInput = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            var generateCode = DateTime.Now.Ticks.ToString();

            if (getUserWithEmailInput == null)
            {
                return BadRequest(new
                {
                    message = "Chưa có tài khoản nào được đăng ký với email này"
                });
            }
            // gửi mail mã xác thực với user khi yêu cầu khôi phục mật khẩu
            var subjectMail = "Mã khôi phục mật khẩu";
            var bodyMail = $@"
                <h3>Xin chào {getUserWithEmailInput.Username},</h3>
                <p>Bạn vừa yêu cầu khôi phục mật khẩu tài khoản.</p>
                <p>Mã khôi phục mật khẩu của bạn là:</p>
                <h2 style='color:#4CAF50'>{generateCode}</h2>
                <p>Mã này sẽ hết hạn sau 5 phút.</p>";
            // Gửi email
            await _emailSender.SendEmailAsync(getUserWithEmailInput.Email, subjectMail, bodyMail);
            // Lưu mã khôi phục mật khẩu vào cơ sở dữ liệu
            var passwordRecovery = new PasswordRecovery
            {
                UserEmail = getUserWithEmailInput.Email,
                RecoveryCode = generateCode,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5), // Mã hết hạn sau 5 phút
            };
            await _context.PasswordRecoveries.AddAsync(passwordRecovery);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Mã khôi phục mật khẩu đã được gửi đến hộp thư email của bạn"
            });
        }

        [HttpPatch("confirm-reset-password")]
        public async Task<IActionResult> ConfirmResetPassword([FromBody] PasswordRecoveryConfirmationDto request)
        {
            var checkUserExist = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (checkUserExist == null)
            {
                return BadRequest(new
                {
                    message = "Người dùng không tồn tại"
                });
            }

            var getPasswordRecoveryRecord = await _context.PasswordRecoveries
                .Where(pr => pr.UsedAt == null)
                .FirstOrDefaultAsync(pr => pr.UserEmail == request.Email && pr.RecoveryCode == request.RecoveryCode);

            if (getPasswordRecoveryRecord == null)
            {
                return BadRequest(new
                {
                    message = "Mã khôi phục mật khẩu không hợp lệ hoặc đã hết hạn"
                });
            }

            // cập nhật mật khẩu mới cho người dùng
            checkUserExist.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            _context.Users.Update(checkUserExist);

            // đánh dấu mã khôi phục mật khẩu đã được sử dụng
            getPasswordRecoveryRecord.UsedAt = DateTime.UtcNow;
            _context.PasswordRecoveries.Update(getPasswordRecoveryRecord);

            await _context.SaveChangesAsync();

            // gửi email phản hồi thành công cho người ta
            var subjectResponseMail = "Khôi phục mật khẩu thành công";
            var bodyResponseMail = $@"
                <h3>Xin chào {checkUserExist.Username},</h3>
                <p>Mật khẩu tài khoản của bạn đã được đặt lại thành công.</p>
                <p>Nếu bạn không thực hiện yêu cầu này và nghĩ rằng ai đó đã tấn công tài khoản, thì kệ bạn hẹ hẹ.</p>";

            await _emailSender.SendEmailAsync(checkUserExist.Email, subjectResponseMail, bodyResponseMail);

            return Ok(new
            {
                message = "Mật khẩu của bạn đã được đặt lại thành công, hãy đăng nhập lại"
            });

        }
    }
}