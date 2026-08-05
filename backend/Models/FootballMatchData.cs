namespace backend.Models {
    public class FootballMatchData {
        public Guid Id { get; set; }
        public string Team1 { get; set; }
        public string Team2 { get; set; }
        public string Time { get; set; }
        public string Date { get; set; }
        public bool IsOccured { get; set; }
        public int ResultWinner { get; set; }
        public DateTime TimeCreated {get; set;}
    }
}