
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using AuthService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
// using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);
// Admin JWT
// var adminKey = builder.Configuration["Jwt:Key"];
// var adminIssuer = builder.Configuration["Jwt:Issuer"];
// var adminAudience = builder.Configuration["Jwt:Audience"];
// User JWT
var userKey = builder.Configuration["UserJwt:Key"];
var userIssuer = builder.Configuration["UserJwt:Issuer"];
var userAudience = builder.Configuration["UserJwt:Audience"];

// Add services to the container.
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });
    
builder.Services.AddDbContext<DataContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        new MySqlServerVersion(new Version(8, 0, 36)) // version MySQL
    ));

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
// builder.Services.AddOpenApi();

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
        Scheme = "bearer",
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

builder.Services.AddAuthentication()
    // Scheme dành cho Admin
    // .AddJwtBearer("AdminScheme", options =>
    // {
    //     options.TokenValidationParameters = new TokenValidationParameters
    //     {
    //         ValidateIssuer = true,
    //         ValidateAudience = true,
    //         ValidateLifetime = true,
    //         ValidateIssuerSigningKey = true,
    //         ValidIssuer = adminIssuer,
    //         ValidAudience = adminAudience,
    //         IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(adminKey))
    //     };
    // })
    // Scheme dành cho User
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
    // // Policy dành cho Admin
    // options.AddPolicy("AdminOnly", policy =>
    //     policy.RequireAuthenticatedUser().AddAuthenticationSchemes("AdminScheme").RequireRole("Admin"));
    // // policy master admin
    // options.AddPolicy("MasterAdminOnly", policy =>
    //     policy.RequireAuthenticatedUser().AddAuthenticationSchemes("AdminScheme").RequireRole("MasterAdmin"));

    // Policy dành cho User
    options.AddPolicy("UserOnly", policy =>
        policy.RequireAuthenticatedUser().AddAuthenticationSchemes("UserScheme").RequireRole("User"));

    // policy dùng cho 2 role Admin và MasterAdmin
    // options.AddPolicy("AdminOrMaster",
    //     policy => policy
    //         .RequireAuthenticatedUser()
    //         .AddAuthenticationSchemes("AdminScheme")
    //         .RequireRole("Admin", "MasterAdmin")
    // );
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
