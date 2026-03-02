using Microsoft.EntityFrameworkCore;
using RecommendPostService.Background;
using RecommendPostService.Data;
using RecommendPostService.Helper;
using RecommendPostService.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
// builder.Services.AddControllers();
builder.Services.AddDbContext<DataContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("MySqlConnect");
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
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
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection();

app.Run();
