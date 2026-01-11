namespace AuthService.Dto
{
    public class VerifyAccountRegCodeDto
    {
        public string UserCode { get; set; }
    }
    public class PasswordRecoveryRequestingDto
    {
        public string Email { get; set; }
    }
    public class PasswordRecoveryConfirmationDto
    {
        public string Email { get; set; }
        public string RecoveryCode { get; set; }
        public string NewPassword { get; set; }
    }
}