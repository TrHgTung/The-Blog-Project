using Google.Apis.Auth.OAuth2;
using Google.Apis.Indexing.v3;
using Google.Apis.Indexing.v3.Data;
using Google.Apis.Services;

namespace backend.Services
{
    public class GoogleIndexingService : IGoogleIndexingService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<GoogleIndexingService> _logger;
        private readonly string? _credentialsPath;

        public GoogleIndexingService(IConfiguration config, ILogger<GoogleIndexingService> logger, IWebHostEnvironment env)
        {
            _config = config;
            _logger = logger;
            
            // Tìm trong thư mục backend/ hoặc backend/Services/
            var path = Path.Combine(env.ContentRootPath, "google-indexing-credentials.json");
            if (File.Exists(path))
            {
                _credentialsPath = path;
            }
        }

        private async Task SendNotification(string url, string type)
        {
            try
            {
                if (string.IsNullOrEmpty(_credentialsPath))
                {
                    _logger.LogWarning("Google Indexing: Chưa tìm thấy file google-indexing-credentials.json trong thư mục backend/. Bỏ qua bước notify.");
                    return;
                }

                GoogleCredential credential;
                using (var stream = new FileStream(_credentialsPath, FileMode.Open, FileAccess.Read))
                {
                    credential = GoogleCredential.FromStream(stream)
                        .CreateScoped(IndexingService.Scope.Indexing);
                }

                var service = new IndexingService(new BaseClientService.Initializer
                {
                    HttpClientInitializer = credential,
                    ApplicationName = "TheBlogProject"
                });

                var urlNotification = new UrlNotification
                {
                    Url = url,
                    Type = type
                };

                _logger.LogInformation("Đang gửi yêu cầu lập chỉ mục tới Google cho: {Url}", url);
                await service.UrlNotifications.Publish(urlNotification).ExecuteAsync();
                _logger.LogInformation("Gửi yêu cầu {Type} thành công cho: {Url}", type, url);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi gửi yêu cầu lập chỉ mục cho {Url}", url);
            }
        }

        public async Task NotifyUrlUpdated(string url)
        {
            await SendNotification(url, "URL_UPDATED");
        }

        public async Task NotifyUrlDeleted(string url)
        {
            await SendNotification(url, "URL_DELETED");
        }
    }
}
