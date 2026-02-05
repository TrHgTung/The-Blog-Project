using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using UserService.Data;
using AuthService.Data;
using NewsFeedService.Data;
using PostService.Data;

var builder = WebApplication.CreateBuilder(args);

var userKey = builder.Configuration["Jwt:Key"];
var userIssuer = builder.Configuration["Jwt:Issuer"];
var userAudience = builder.Configuration["Jwt:Audience"];
var conn = builder.Configuration.GetConnectionString("MainDb");

// Add DbContext cho từng service
builder.Services.AddDbContext<UserDbContext>(opt =>
    opt.UseSqlServer(conn));

builder.Services.AddDbContext<AuthDbContext>(opt =>
    opt.UseSqlServer(conn));

builder.Services.AddDbContext<PostDbContext>(opt =>
    opt.UseSqlServer(conn));


// Add services to the container.
builder.Services.AddAuthentication("Bearer")
.AddJwtBearer("Bearer", options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])
        )
    };
});

builder.Services.AddAuthentication()
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

builder.Configuration.AddJsonFile(
    "ocelot.json",
    optional: false,
    reloadOnChange: true
);

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("UserOnly", policy =>
        policy.RequireAuthenticatedUser().AddAuthenticationSchemes("UserScheme").RequireRole("User"));
});

builder.Services.AddAuthorization();
builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// middleware forward user info
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated == true)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (!string.IsNullOrEmpty(userId))
            context.Request.Headers["X-User-Id"] = userId;

        if (!string.IsNullOrEmpty(role))
            context.Request.Headers["X-User-Role"] = role;
    }

    await next();
});

await app.UseOcelot();
app.Run();
