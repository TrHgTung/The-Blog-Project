using TheBlog.Shared.DTOs;

namespace UserService.Dto
{
    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
    }
    public static class SecureValidateDto
    {
        public static ValidationResult ValidatePostDto(PostDto dto)
        {
            var result = new ValidationResult { IsValid = true };

            if(dto == null)
            {
                result.IsValid = false;
                result.Errors.Add("Error null DTO");
            }

            if (string.IsNullOrWhiteSpace(dto.PostTitle))
            {
                result.IsValid = false;
                result.Errors.Add("Post title is required.");
            }
            else if (dto.PostTitle.Length > 200)
            {
                result.IsValid = false;
                result.Errors.Add("Post title cannot exceed 200 characters.");
            }

            if (string.IsNullOrWhiteSpace(dto.PostContent))
            {
                result.IsValid = false;
                result.Errors.Add("Post content is required.");
            }

            return result;
        }
        public static ValidationResult ValidateCreateTopicDto(CreateTopicDto dto)
        {
            var result = new ValidationResult { IsValid = true };

            if(dto == null)
            {
                result.IsValid = false;
                result.Errors.Add("Error null DTO");
            }

            if (string.IsNullOrWhiteSpace(dto.TopicName))
            {
                result.IsValid = false;
                result.Errors.Add("Topic name is required.");
            }
            if (dto.TopicName.Length > 99)
            {
                result.IsValid = false;
                result.Errors.Add("Topic name cannot exceed 99 characters.");
            }

            if (string.IsNullOrWhiteSpace(dto.TopicDescription))
            {
                result.IsValid = false;
                result.Errors.Add("Topic description is required.");
            }

            if (dto.TopicDescription.Length > 255)
            {
                result.IsValid = false;
                result.Errors.Add("Topic description cannot exceed 255 characters.");
            }

            return result;
        }
        public static ValidationResult ValidateEditTopicDto(EditTopicDto dto)
        {
            var result = new ValidationResult { IsValid = true };
 
            if (dto.TopicName.Length > 99)
            {
                result.IsValid = false;
                result.Errors.Add("Topic name cannot exceed 99 characters.");
            }

            if (dto.TopicDescription.Length > 255)
            {
                result.IsValid = false;
                result.Errors.Add("Topic description cannot exceed 255 characters.");
            }

            return result;
        }
        public static ValidationResult ValidateTransferOwnerTopicDto(TransferOwnerTopicDto dto)
        {
            var result = new ValidationResult { IsValid = true };
 
            if (dto.TopicId == Guid.Empty || dto.UserId == Guid.Empty)
            {
                result.IsValid = false;
                result.Errors.Add("Topic ID and User ID are required.");
            }

            return result;
        }
        public static ValidationResult ValidateCommentDto(CommentDto dto)
        {
            var result = new ValidationResult { IsValid = true };

            if (dto == null)
            {
                result.IsValid = false;
                result.Errors.Add("Error null DTO");
            }

            if (string.IsNullOrWhiteSpace(dto.CommentContent))
            {
                result.IsValid = false;
                result.Errors.Add("Comment content is required.");
            }
            else if (dto.CommentContent.Length > 256)
            {
                result.IsValid = false;
                result.Errors.Add("Comment content cannot exceed 256 characters.");
            }

            return result;
        }
        public static ValidationResult ValidateReplyCmtDto(ReplyCmtDto dto)
        {
            var result = new ValidationResult { IsValid = true };

            if (dto == null)
            {
                result.IsValid = false;
                result.Errors.Add("Error null DTO");
            }

            if (string.IsNullOrWhiteSpace(dto.ReplyCmtContent))
            {
                result.IsValid = false;
                result.Errors.Add("The reply of a comment is required.");
            }
            else if (dto.ReplyCmtContent.Length > 256)
            {
                result.IsValid = false;
                result.Errors.Add("The reply of a comment cannot exceed 256 characters.");
            }

            return result;
        }
    }
}