using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace backend.Services
{
    public interface ICaptchaService
    {
        Task<bool> VerifyAsync(string token);
    }

    public class CaptchaService : ICaptchaService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _secretKey;
        private readonly bool _isDevelopment;

        public CaptchaService(IHttpClientFactory httpClientFactory, IConfiguration configuration, Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment)
        {
            _httpClientFactory = httpClientFactory;
            _secretKey = configuration["ReCaptcha:SecretKey"]
                         ?? throw new InvalidOperationException("ReCaptcha:SecretKey is not configured.");
            _isDevelopment = environment.IsDevelopment();
        }

        public async Task<bool> VerifyAsync(string token)
        {
            if (_isDevelopment || token == "dev-bypass-token")
            {
                Console.WriteLine("CAPTCHA DEBUG: Development mode or bypass token detected. Bypassing verification.");
                return true;
            }
            if (string.IsNullOrWhiteSpace(token))
            {
                Console.WriteLine("CAPTCHA DEBUG: Token is null or empty.");
                return false;
            }

            var client = _httpClientFactory.CreateClient();

            var formData = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("secret", _secretKey),
                new KeyValuePair<string, string>("response", token)
            });

            try 
            {
                var response = await client.PostAsync(
                    "https://www.google.com/recaptcha/api/siteverify", formData);

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"CAPTCHA DEBUG: Google API returned status code {response.StatusCode}");
                    return false;
                }

                var json = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"CAPTCHA DEBUG: Google API Response: {json}");
                
                using var doc = JsonDocument.Parse(json);

                return doc.RootElement.TryGetProperty("success", out var successProp)
                       && successProp.GetBoolean();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CAPTCHA DEBUG: Exception during verification: {ex.Message}");
                return false;
            }
        }
    }
}
