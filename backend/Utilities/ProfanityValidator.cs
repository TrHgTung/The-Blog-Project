using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Utilities
{
    public class NotProfaneAttribute : ValidationAttribute
    {
        private static List<string>? _badWords;
        private static readonly object _lock = new object();
        // private readonly IWebHostEnvironment _environment;

        private void LoadBadWords()
        {
            if (_badWords != null) return;

            lock (_lock)
            {
                if (_badWords != null) return;

                try
                {
                    string filePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "bad-words.json");
                    // If it's not in the bin folder (e.g. during dev), try the source folder
                    if (!File.Exists(filePath))
                    {
                        filePath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "bad-words.json");
                    }

                    if (File.Exists(filePath))
                    {
                        string json = File.ReadAllText(filePath);
                        _badWords = JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
                    }
                    else
                    {
                        _badWords = new List<string>();
                    }
                }
                catch
                {
                    _badWords = new List<string>();
                }
            }
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            // Kiểm tra nếu người dùng là Admin thì bỏ qua lọc từ ngữ
            var httpContextAccessor = validationContext.GetService<IHttpContextAccessor>();
            if (httpContextAccessor?.HttpContext?.User != null)
            {
                var user = httpContextAccessor.HttpContext.User;
                if (user.Identity?.IsAuthenticated == true && user.IsInRole("Admin"))
                {
                    return ValidationResult.Success;
                }
            }

            if (value == null) return ValidationResult.Success;

            LoadBadWords();

            string content = value.ToString() ?? string.Empty;

            foreach (var word in _badWords!)
            {
                if (content.Contains(word, StringComparison.OrdinalIgnoreCase))
                {
                    return new ValidationResult(ErrorMessage ?? "Nội dung chứa từ ngữ không hợp lệ.");
                }
            }

            return ValidationResult.Success;
        }
    }
}
