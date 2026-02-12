using System.ComponentModel.DataAnnotations;

namespace UserService.Dto
{
    public class ReplyCmtDto
    {
         [Required]
        [MaxLength(256)]
        public string ReplyCmtContent { get; set; }
    }
}
