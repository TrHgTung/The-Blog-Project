using UserService.Data;
using Microsoft.EntityFrameworkCore;
using UserService.MessageBus;
using UserService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSingleton<IMessageBus, RabbitMqMessageBus>();
builder.Services.AddDbContext<DataContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("MySqlConnect"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("MySqlConnect"))
    )
);

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "UserService_";
});

builder.Services.AddScoped<IRedisCacheService, RedisCacheService>();

var userKey = builder.Configuration["Jwt:Key"];
var userIssuer = builder.Configuration["Jwt:Issuer"];
var userAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication("UserScheme")
    .AddJwtBearer("UserScheme", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = userIssuer,
            ValidAudience = userAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(userKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("UserOnly", policy =>
        policy.RequireAuthenticatedUser().AddAuthenticationSchemes("UserScheme").RequireRole("User"));
});

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
