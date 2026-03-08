using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using UserService.Data;
using UserService.Model;
using TheBlog.Shared.DTOs;

namespace UserService.MessageBus;

public class UserRegistrationSubscriber : BackgroundService
{
    private readonly IConfiguration _configuration;
    private readonly IServiceProvider _serviceProvider;
    private IConnection? _connection;
    private IChannel? _channel;

    public UserRegistrationSubscriber(IConfiguration configuration, IServiceProvider serviceProvider)
    {
        _configuration = configuration;
        _serviceProvider = serviceProvider;
    }

    private async Task<bool> InitializeRabbitMQ()
    {
        try
        {
            var factory = new ConnectionFactory()
            {
                HostName = _configuration["RabbitMQ:HostName"] ?? "127.0.0.1"
            };
            _connection = await factory.CreateConnectionAsync();
            _channel = await _connection.CreateChannelAsync();

            await _channel.QueueDeclareAsync(queue: "user-registered-queue", durable: false, exclusive: false, autoDelete: false, arguments: null);
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        int retries = 10;
        while (retries > 0 && !await InitializeRabbitMQ())
        {
            retries--;
            if (retries == 0) return;
            await Task.Delay(2000, stoppingToken);
        }

        if (_channel == null) return;

        stoppingToken.Register(() => 
        {
            _channel?.CloseAsync();
            _connection?.CloseAsync();
        });

        var consumer = new AsyncEventingBasicConsumer(_channel!);
        consumer.ReceivedAsync += async (model, ea) =>
        {
            var body = ea.Body.ToArray();
            var message = Encoding.UTF8.GetString(body);
            var userDto = JsonSerializer.Deserialize<UserDto>(message);

            if (userDto != null)
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<DataContext>();
                    
                    var upsInfo = new UserPublicSocialInformation
                    {
                        Id = Guid.NewGuid(),
                        UserId = userDto.UserId,
                        Username = userDto.Username,
                        FirstName = userDto.FirstName,
                        LastName = userDto.LastName,
                        AvatarImage = userDto.AvatarImage,
                        AccountStatus = userDto.AccountStatus,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    context.UPSInfo.Add(upsInfo);
                    await context.SaveChangesAsync();
                }
            }
        };

        await _channel.BasicConsumeAsync(queue: "user-registered-queue", autoAck: true, consumer: consumer);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(1000, stoppingToken);
        }
    }
}
