using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using backend.Data;
using backend.Models;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace backend.Utilities
{
    public class IdempotentAttribute : TypeFilterAttribute
    {
        public IdempotentAttribute() : base(typeof(IdempotentFilter))
        {
        }
    }

    public class IdempotentFilter : IAsyncActionFilter
    {
        private readonly DataContext _context;

        public IdempotentFilter(DataContext context)
        {
            _context = context;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (!context.HttpContext.Request.Headers.TryGetValue("X-Idempotency-Key", out var idempotencyKey) || string.IsNullOrEmpty(idempotencyKey))
            {
                await next();
                return;
            }

            var key = idempotencyKey.ToString();

            // Check if record exists
            var record = await _context.IdempotencyRecords.FirstOrDefaultAsync(r => r.RequestKey == key);
            if (record != null)
            {
                // Return cached response
                context.Result = new ContentResult
                {
                    Content = record.ResponseBody,
                    ContentType = "application/json",
                    StatusCode = record.StatusCode
                };
                return;
            }

            // Execute the action
            var executedContext = await next();

            // Store the result if it was successful (2xx) or even if it's a validation error (400) 
            // depending on business rules. Usually, we store everything to follow the "same result" principle.
            if (executedContext.Result is ObjectResult objectResult)
            {
                var responseBody = JsonSerializer.Serialize(objectResult.Value);
                var statusCode = objectResult.StatusCode ?? 200;

                // Create record (Double check if someone else inserted it in the meantime)
                var exists = await _context.IdempotencyRecords.AnyAsync(r => r.RequestKey == key);
                if (!exists)
                {
                    _context.IdempotencyRecords.Add(new IdempotencyRecord
                    {
                        RequestKey = key,
                        StatusCode = statusCode,
                        ResponseBody = responseBody,
                        CreatedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();
                }
            }
        }
    }
}
