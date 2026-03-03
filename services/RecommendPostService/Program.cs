using Microsoft.EntityFrameworkCore;
using RecommendPostService.Background;
using RecommendPostService.Data;
using RecommendPostService.Helper;
using RecommendPostService.Services;
using Microsoft.OpenApi.Models;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
// builder.Services.AddControllers();
builder.Services.AddDbContext<DataContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("MySqlConnect");
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0)));
});

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "RecommendPostService_";
});

builder.Services.AddScoped<IRedisCacheService, RedisCacheService>();
builder.Services.AddScoped<CalculateTrendingScore>();
builder.Services.AddHttpClient("UserService", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ServiceUrls:UserService"] ?? "http://localhost:5091");
});
builder.Services.AddHostedService<TrendingConsumer>(); // Register background service
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Recommend Post Service API", Version = "v1" });
});

var app = builder.Build();
// Ensure Database is created with retry logic
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var context = services.GetRequiredService<DataContext>();
    
    var connStr = app.Configuration.GetConnectionString("MySqlConnect");
    logger.LogInformation("Database initialization started with connection string part: {ConnStr}...", 
        string.IsNullOrEmpty(connStr) ? "NULL" : connStr.Split(';')[0]);

    int retries = 15;
    while (retries > 0)
    {
        try
        {
            logger.LogInformation("Attempting to connect to database... (Retries left: {Retries})", retries);
            await context.Database.EnsureCreatedAsync();
            logger.LogInformation("Database connection successful and schema ensured.");
            break;
        }
        catch (Exception ex)
        {
            retries--;
            if (retries == 0)
            {
                logger.LogCritical(ex, "Could not connect to database after 15 attempts. Exiting.");
                throw;
            }
            logger.LogWarning("Database not ready yet (message: {Msg}), retrying in 5 seconds...", ex.Message);
            await Task.Delay(5000);
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.Run();
