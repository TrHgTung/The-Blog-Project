using System;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace backend.Data.DTOs
{
    public class SearchDto
    {
        [Required(ErrorMessage = "Từ khóa tìm kiếm không được để trống.")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "Từ khóa phải từ 1 đến 50 ký tự.")]
        [NoSpecialCharsOrEmoji(ErrorMessage = "Từ khóa không được chứa ký tự đặc biệt hoặc emoji.")]
        public string KeywordInput { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "Số trang phải lớn hơn 0.")]
        public int Page { get; set; } = 1;

        [Range(1, 50, ErrorMessage = "Giới hạn kết quả phải từ 1 đến 50.")]
        public int Limit { get; set; } = 10;
    }

    public class NoSpecialCharsOrEmojiAttribute : ValidationAttribute
    {
        // Allow letters (any language), digits, spaces, hyphens, underscores, dots
        private static readonly Regex AllowedPattern = new Regex(
            @"^[\p{L}\p{N}\s\-_.]+$",
            RegexOptions.Compiled
        );

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is not string str || string.IsNullOrWhiteSpace(str))
                return ValidationResult.Success;

            if (!AllowedPattern.IsMatch(str))
                return new ValidationResult(ErrorMessage ?? "Chứa ký tự không hợp lệ.");

            return ValidationResult.Success;
        }
    }
}
