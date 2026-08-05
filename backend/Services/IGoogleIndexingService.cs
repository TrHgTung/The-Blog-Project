namespace backend.Services
{
    public interface IGoogleIndexingService
    {
        Task NotifyUrlUpdated(string url);
        Task NotifyUrlDeleted(string url);
    }
}
