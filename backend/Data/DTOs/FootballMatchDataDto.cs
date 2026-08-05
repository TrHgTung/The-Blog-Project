using System.ComponentModel.DataAnnotations;

namespace backend.DTOs {
    public class FootballMatchDataDto {
        [Required]
        public string Team1 { get; set; }
        [Required]
        public string Team2 { get; set; }
        [Required]
        public string Time { get; set; }
        [Required]
        public string Date { get; set; }
        public bool IsOccured { get; set; }
        public int ResultWinner { get; set; }
        [Required]
        public DateTime TimeCreated {get; set;}
    }
}