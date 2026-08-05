using System.Text;
using System.Text.RegularExpressions;

namespace backend.Utilities
{
    public static class SlugHelper
    {
        public static string GenerateSlug(string title)
        {
            if (string.IsNullOrEmpty(title)) return "";

            // Convert to lowercase
            string slug = title.ToLowerInvariant();

            // Replace Vietnamese characters
            slug = ReplaceVietnameseCharacters(slug);

            // Remove invalid characters
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");

            // Replace multiple spaces or hyphens with a single hyphen
            slug = Regex.Replace(slug, @"[\s-]+", "-").Trim('-');

            // Truncate to 155 characters
            if (slug.Length > 155)
            {
                slug = slug.Substring(0, 155).Trim('-');
            }

            return slug;
        }

        private static string ReplaceVietnameseCharacters(string str)
        {
            string[] vietnameseSigns = new string[]
            {
                "aAeEoOuUiIdDyY",
                "áàảãạâấầẩẫậăắằẳẵặ",
                "ÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶ",
                "éèẻẽẹêếềểễệ",
                "ÉÈẺẼẸÊẾỀỂỄỆ",
                "óòỏõọôốồổỗộơớờởỡợ",
                "ÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢ",
                "úùủũụưứừửữự",
                "ÚÙỦŨỤƯỨỪỬỮỰ",
                "íìỉĩị",
                "ÍÌỈĨỊ",
                "đ",
                "Đ",
                "ýỳỷỹỵ",
                "ÝỲỶỸỴ"
            };

            for (int i = 1; i < vietnameseSigns.Length; i++)
            {
                for (int j = 0; j < vietnameseSigns[i].Length; j++)
                {
                    str = str.Replace(vietnameseSigns[i][j], vietnameseSigns[0][i - 1]);
                }
            }
            return str;
        }
    }
}
