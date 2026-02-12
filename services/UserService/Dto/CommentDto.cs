using System.ComponentModel.DataAnnotations;

namespace UserService.Dto
{
    public class CommentDto
    {
        [Required]
        [MaxLength(256)]
        public string CommentContent { get; set; }
    }
}