using backend.Hubs;
using Microsoft.OpenApi.Models;
using System.Text;
using backend.Data;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.FileProviders;
using System.IO;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using backend.Models;
using System.Security.Claims;
using Microsoft.Extensions.DependencyInjection;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Cấu hình Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration) // Cho phép cấu hình từ appsettings.json
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logt", 
        rollingInterval: RollingInterval.Day, // Lưu theo ngày
        retainedFileCountLimit: 2,             // Giữ tối đa 2 file (tương đương 48 tiếng)
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// CORS
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddHealthChecks()
    .AddDbContextCheck<DataContext>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddEndpointsApiExplorer();

// Rate Limiting theo IP thật của client (hỗ trợ Nginx reverse proxy qua X-Forwarded-For)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Tin tưởng tất cả proxy (trong Docker network) - có thể giới hạn hơn nếu cần
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddRateLimiter(options =>
{
    // Lấy IP thật: ưu tiên X-Forwarded-For (Nginx), fallback về RemoteIpAddress
    static string GetClientIp(HttpContext ctx) =>
        ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim()
        ?? ctx.Connection.RemoteIpAddress?.ToString()
        ?? "unknown";

    // rule rate limit for others: 35 req/phút mỗi IP client
    options.AddPolicy(policyName: "fixed", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: GetClientIp(httpContext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 35,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            }));

     // rule rate limit for create post, magazines (15 req/1p)
    options.AddPolicy(policyName: "resource", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: GetClientIp(httpContext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 15,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            }));
     // rule rate limit for create comments (20req/1p)
    options.AddPolicy(policyName: "comment", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: GetClientIp(httpContext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            }));

    // rule rate limt for chat: 150 req/phút mỗi IP - thoáng hơn vì realtime
    options.AddPolicy(policyName: "chat", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: GetClientIp(httpContext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 150,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            }));

    // rule for automation/n8n: Giới hạn chặt hơn (ví dụ 5 bài/phút) để chống spam
    options.AddPolicy(policyName: "automation", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: GetClientIp(httpContext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            }));

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsync("Too many requests. Please try again later.");
    };
});

// DB Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<DataContext>(options =>
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 0)), 
        mysqlOptions => mysqlOptions.EnableRetryOnFailure()));

// Redis Cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:8001";
    options.InstanceName = "TheBlogProject_";
});

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<ICaptchaService, CaptchaService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IGoogleIndexingService, GoogleIndexingService>();

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                builder.Configuration["Jwt:Token"] ?? throw new InvalidOperationException("JWT Token is not configured in appsettings.json"))),
            ValidateIssuer = false,
            ValidateAudience = false
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && 
                    (path.StartsWithSegments("/chathub") || path.StartsWithSegments("/notificationhub")))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var dbContext = context.HttpContext.RequestServices.GetRequiredService<DataContext>();
                var userIdStr = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentSessionSecret = context.Principal?.FindFirstValue(ClaimTypes.Sid);

                if (Guid.TryParse(userIdStr, out var userId))
                {
                    var user = await dbContext.Users.FindAsync(userId);
                    if (user == null || !user.IsActive)
                    {
                        context.Fail("Người dùng không tồn tại hoặc đã bị khóa.");
                        return;
                    }

                    // 1. Kiểm tra session hiện tại (đây là cách đăng xuất tức thì cho từng máy)
                    if (!string.IsNullOrEmpty(currentSessionSecret))
                    {
                        var session = await dbContext.LoginSessions
                            .FirstOrDefaultAsync(s => s.UserId == userId && s.SessionSecret == currentSessionSecret);
                        
                        // Nếu session không tồn tại hoặc đã bị thu hồi (RevokedAt != null)
                        if (session == null || session.RevokedAt != null)
                        {
                            context.Fail("Phiên đăng nhập này đã kết thúc.");
                            return;
                        }
                    }

                    // 2. Kiểm tra mốc thời gian thu hồi global (thường dùng khi reset password)
                    var iatClaim = context.SecurityToken.ValidFrom;
                    if (user.TokenRevokedBefore.HasValue && iatClaim < user.TokenRevokedBefore.Value)
                    {
                        context.Fail("Phiên này đã hết hạn bảo mật (yêu cầu cấp mới).");
                    }
                }
            }
        };
    });

// CORS
builder.Services.AddCors(opt =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                         ?? new[] { "http://localhost:3000" };

    opt.AddPolicy(name: MyAllowSpecificOrigins, 
        policy =>
        {
            policy.WithOrigins(allowedOrigins)
                .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .WithHeaders("Content-Type", "Authorization", "Accept", "X-Requested-With", "X-SignalR-User-Agent", "X-Idempotency-Key", "X-Score-Secret-Key") // Thêm header liên quan đến SignalR và REST tiêu chuẩn
                .AllowCredentials();
        });
});

// SignalR
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Request Timeouts
builder.Services.AddRequestTimeouts(options =>
{
    options.DefaultPolicy = new Microsoft.AspNetCore.Http.Timeouts.RequestTimeoutPolicy
    {
        Timeout = TimeSpan.FromSeconds(30),
        TimeoutStatusCode = StatusCodes.Status504GatewayTimeout
    };
    options.AddPolicy("UploadPolicy", TimeSpan.FromMinutes(1)); // dối với upload file thì báo timeout sau 1p
});

var app = builder.Build();

// Phải đặt đầu tiên để giải mã IP thật từ Nginx trước khi bất kỳ middleware nào chạy
app.UseForwardedHeaders();

// Request Timeouts should be early in the pipeline
app.UseRequestTimeouts();

// Auto apply migrations on startup (helpful for Docker)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<DataContext>();
        if (context.Database.GetPendingMigrations().Any())
        {
            context.Database.Migrate();
        }

        // Seed Master Admin Account
        var config = services.GetRequiredService<IConfiguration>();
        var adminUsername = config["AdminAccount:Username"];
        var adminPassword = config["AdminAccount:Password"];

        if (string.IsNullOrEmpty(adminUsername) || string.IsNullOrEmpty(adminPassword))
        {
            Console.WriteLine("DEBUG: Admin account configuration missing, skipping seed.");
        }
        else
        {
            var existingAdmin = context.Users.FirstOrDefault(u => u.Username == adminUsername);
            if (existingAdmin == null)
            {
                var authService = services.GetRequiredService<IAuthService>();
                var admin = new User
                {
                    Id = Guid.NewGuid(),
                    Username = adminUsername,
                    DisplayName = "Master Administrator",
                    Email = "admin@blogsocial.io.vn",
                    Password = authService.HashPassword(adminPassword),
                    ProfilePicture = config["ProductionURL"] + "favicon.png",
                    Bio = "Master Administrator",
                    DateOfBirth = DateTime.UtcNow,
                    cartoonCharacter = "448",
                    IsAdmin = true,
                    IsEmailVerified = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Users.Add(admin);
                context.SaveChanges();
                Console.WriteLine($"DEBUG: Master Admin account created successfully with username: {adminUsername}");
            }
            else if (!existingAdmin.IsAdmin)
            {
                existingAdmin.IsAdmin = true;
                context.SaveChanges();
                Console.WriteLine($"DEBUG: Master Admin account updated to be Admin");
            }
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database or seeding.");
    }
}


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>

    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Social Blog API v1");
    });
}

else {}

app.UseStaticFiles(); 

// Đảm bảo phục vụ thư mục uploads cụ thể nếu UseStaticFiles mặc định không nhận diện được
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseCors(MyAllowSpecificOrigins);

app.UseRouting(); 
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers().RequireRateLimiting("fixed"); // rule rate limiting mặc định
app.MapHealthChecks("/api/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var response = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description
            }),
            timestamp = DateTime.UtcNow
        };
        await context.Response.WriteAsJsonAsync(response);
    }
});
app.MapHub<ChatHub>("/chathub");
app.MapHub<NotificationHub>("/notificationhub");

try
{
    Log.Information("Starting the server application");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Fatal error: The application has been terminated unexpectedly. Please re-check");
}
finally
{
    Log.CloseAndFlush();
}


