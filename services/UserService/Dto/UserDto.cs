namespace UserService.Dto
{
    public class UserUpdateDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? AvatarImage { get; set; }
        public string? CoverImage { get; set; }
        public string? Bio { get; set; }
        public string? CurrentCity { get; set; }
        public string? Hometown { get; set; }
        public string? Workplace { get; set; }
        public string? Education { get; set; }
        public string? Gender { get; set; }
        public string? RelationshipStatus { get; set; }
        public string? FavoriteCharacter { get; set; }
        public DateTime? DateOfBirth { get; set; }
    }
}