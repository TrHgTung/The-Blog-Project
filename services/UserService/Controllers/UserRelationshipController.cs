using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserService.Data;
using UserService.Model;

namespace UserService.Controllers
{
    [ApiController]
    [Route("api/user-service/[controller]")]
    public class UserRelationshipController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IConfiguration _configuration;
        public UserRelationshipController(DataContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // ALL ACTION BEHAVIOR MADE BY USER


        // an user follows another user
        [HttpPost("follow/{targetUserId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> UserFollowUser(Guid targetUserId)
        {
            // Implementation for following a user
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (getCurrentUser == null)
            {
                return Unauthorized();
            }
            else
            {
                var currentUserId = Guid.Parse(getCurrentUser);
                var checkUserFollowOrNot = _context.UFStatus
                                                .FirstOrDefault(uf =>
                                                            (uf.UserIdA == currentUserId && uf.UserIdB == targetUserId)
                                                );

                if (checkUserFollowOrNot != null)
                {
                    checkUserFollowOrNot.IsFollowing = true;
                    checkUserFollowOrNot.FollowAt = DateTime.UtcNow;

                    _context.UFStatus.Update(checkUserFollowOrNot);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    var initFollowRelation = new UserFollowStatus
                    {
                        Id = Guid.NewGuid(),
                        UserIdA = currentUserId,
                        UserIdB = targetUserId,
                        IsFollowing = true,
                        FollowAt = DateTime.UtcNow
                    };
                    _context.UFStatus.Add(initFollowRelation);
                    await _context.SaveChangesAsync();
                }
            }

            return Ok();
        }

        [HttpPatch("unfollow/{targetUserId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> UserUnfollowUser(Guid targetUserId)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            // var currentUserId = new Guid(getCurrentUser);
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }
            else
            {
                var currentUserId = Guid.Parse(getCurrentUser);
                var checkUserFollowOrNot = _context.UFStatus
                                                .FirstOrDefault(uf =>
                                                            (uf.UserIdA == currentUserId && uf.UserIdB == targetUserId)
                                                            // && (uf.UserIdB == targetUserId || uf.UserIdA == targetUserId));
                                                );

                if (checkUserFollowOrNot != null)
                {
                    checkUserFollowOrNot.IsFollowing = false;
                    checkUserFollowOrNot.UnfollowAt = DateTime.UtcNow;

                    _context.UFStatus.Update(checkUserFollowOrNot);
                    await _context.SaveChangesAsync();
                }
            }

            return Ok();
        }
        [HttpPatch("block/{targetUserId}")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> UserBlockUser(Guid targetUserId)
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            // var currentUserId = new Guid(getCurrentUser);
            if (getCurrentUser == null)
            {
                return Unauthorized();
            }
            else
            {
                var currentUserId = Guid.Parse(getCurrentUser);
                var checkUserBlockStatus = _context.UFStatus
                                                .FirstOrDefault(uf =>
                                                            (uf.UserIdA == currentUserId || uf.UserIdB == currentUserId)
                                                            && (uf.UserIdB == targetUserId || uf.UserIdA == targetUserId));

                if (checkUserBlockStatus != null)
                {
                    checkUserBlockStatus.IsBlocked = true;

                    _context.UFStatus.Update(checkUserBlockStatus);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    var initFollowRelation = new UserFollowStatus
                    {
                        Id = Guid.NewGuid(),
                        UserIdA = currentUserId,
                        UserIdB = targetUserId,
                        IsBlocked = true
                    };
                    _context.UFStatus.Add(initFollowRelation);
                    await _context.SaveChangesAsync();
                }
            }

            return Ok();

        }


        // DECIDE WHOSE POST TO SHOW WITH AN USER

        // filter users blocked or normal
        [HttpGet("available-users-in-feed")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> DecideWhosePostIsAvailableInNewsFeed()
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (getCurrentUser == null)
            {
                return Unauthorized();
            }
            else
            {
                var currentUserId = Guid.Parse(getCurrentUser);
                var blockedUsers = _context.UFStatus
                                        .Where(uf => (uf.UserIdA == currentUserId || uf.UserIdB == currentUserId)
                                                    && uf.IsBlocked == true)
                                        .Select(uf => uf.UserIdA == currentUserId ? uf.UserIdB : uf.UserIdA)
                                        .ToList();

                var allAvailableUsers = await _context.UPSInfo
                                .Where(u => u.UserId != currentUserId
                                            && u.AccountStatus == "1"
                                            && !_context.UFStatus.Any(ufs => ufs.IsBlocked && ((ufs.UserIdA == currentUserId || ufs.UserIdB == currentUserId) && (ufs.UserIdB == u.UserId || ufs.UserIdA == u.UserId)))
                                )
                                .Select(u => new
                                {
                                    u.Id,
                                    u.Username,
                                    u.FirstName,
                                    u.LastName,
                                    u.AvatarImage
                                })
                                .AsNoTracking()
                                .ToListAsync();

                return Ok(allAvailableUsers);
            }
        }

        // user available in chat message
        [HttpGet("online-user")]
        [Authorize(AuthenticationSchemes = "UserScheme")]
        public async Task<IActionResult> ShowAvailableUsersOnChatbox()
        {
            var getCurrentUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (getCurrentUser == null)
            {
                return Unauthorized();
            }
            else
            {
                var currentUserId = Guid.Parse(getCurrentUser);
                var getAllUsersFollowedByCurrentUser = await _context.UFStatus
                                .Where(uf => uf.UserIdA == currentUserId && uf.IsFollowing == true)
                                .Join(_context.UPSInfo, 
                                    uf => uf.UserIdB, 
                                    ups => ups.UserId, 
                                    (uf, ups) => new {
                                        Id = ups.UserId,
                                        ups.Username,
                                        ups.FirstName,
                                        ups.LastName,
                                        ups.AvatarImage
                                    })
                                .ToListAsync();

                return Ok(getAllUsersFollowedByCurrentUser);
            }
        }
    }
}