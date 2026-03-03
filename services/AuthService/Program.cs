
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using AuthService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using AuthService.Helper.EmailSender;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);
// User JWT
var userKey = builder.Configuration["Jwt:Key"];
var userIssuer = builder.Configuration["Jwt:Issuer"];
var userAudience = builder.Configuration["Jwt:Audience"];

// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("MySqlConnect");

builder.Services.AddDbContext<DataContext>(options =>
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0))));

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "AuthService_";
});

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(s =>
{
    s.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "The Blog Project - Auth Service API",
        Version = "v1"
    });

    var jwtSecurityScheme = new OpenApiSecurityScheme
    {
        Scheme = "Bearer",
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Description = "JWT Authorization header",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }

    };

    s.AddSecurityDefinition(jwtSecurityScheme.Reference.Id, jwtSecurityScheme);

    s.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

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


builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings"));

builder.Services.AddScoped<IEmailSender, EmailSenderHelper>();

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
