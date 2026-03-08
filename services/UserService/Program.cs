using UserService.Data;
using Microsoft.EntityFrameworkCore;
using UserService.MessageBus;
using UserService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSingleton<IMessageBus, RabbitMqMessageBus>();
builder.Services.AddHostedService<UserRegistrationSubscriber>();
builder.Services.AddDbContext<DataContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("MySqlConnect"),
        new MySqlServerVersion(new Version(8, 0))
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
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "User Service API", Version = "v1" });
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
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
