using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace ChatService.Helper
{
    public class NameIdentifierProvider : IUserIdProvider
    {
        public string GetUserId(HubConnectionContext connection)
        {
            return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }
}