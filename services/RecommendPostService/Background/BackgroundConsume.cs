using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using RecommendPostService.Helper;
using RecommendPostService.MessageBus;

namespace RecommendPostService.Background;

public class TrendingConsumer : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TrendingConsumer> _logger;
    private IConnection? _connection;
    private IChannel? _channel;

    public TrendingConsumer(IServiceScopeFactory scopeFactory, IConfiguration configuration, ILogger<TrendingConsumer> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            // Get RabbitMQ configuration from appsettings
            var rabbitMqConfig = _configuration.GetSection("RabbitMQ");
            var hostName = rabbitMqConfig["HostName"] ?? "localhost";
            var port = int.TryParse(rabbitMqConfig["Port"], out var p) ? p : 5672;
            var userName = rabbitMqConfig["UserName"] ?? "guest";
            var password = rabbitMqConfig["Password"] ?? "guest";
            var queueName = rabbitMqConfig["QueueName"] ?? "post-trending";

            var factory = new ConnectionFactory
            {
                HostName = hostName,
                Port = port,
                UserName = userName,
                Password = password,
                DispatchConsumersAsync = true
            };

            _connection = await factory.CreateConnectionAsync(cancellationToken: stoppingToken);
            _channel = await _connection.CreateChannelAsync(cancellationToken: stoppingToken);

            // Declare queue
            await _channel.QueueDeclareAsync(
                queue: queueName,
                durable: false,
                exclusive: false,
                autoDelete: false,
                arguments: null,
                cancellationToken: stoppingToken);

            _logger.LogInformation($"Connected to RabbitMQ on {hostName}:{port}. Queue: {queueName}");

            var consumer = new AsyncEventingBasicConsumer(_channel);
            consumer.Received += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var json = Encoding.UTF8.GetString(body);
                    var message = JsonSerializer.Deserialize<PostTrendingMessage>(json);

                    if (message == null)
                    {
                        _logger.LogWarning("Received null message from queue");
                        return;
                    }

                    _logger.LogInformation($"Processing post trending message for PostId: {message.PostId}");

                    using var scope = _scopeFactory.CreateScope();
                    var calculator = scope.ServiceProvider.GetRequiredService<CalculateTrendingScore>();
                    await calculator.CalculateTrendingValueForAPost(message.PostId);

                    _logger.LogInformation($"Successfully processed PostId: {message.PostId}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing message from queue");
                }
            };

            await _channel.BasicConsumeAsync(
                queue: queueName,
                autoAck: true,
                consumerTag: "TrendingConsumer",
                consumerDispatcher: consumer,
                cancellationToken: stoppingToken);

            _logger.LogInformation("TrendingConsumer started and listening for messages");

            // Keep the consumer running until cancellation is requested
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in TrendingConsumer.ExecuteAsync");
            throw;
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_channel != null)
        {
            await _channel.CloseAsync(cancellationToken: cancellationToken);
            _channel?.Dispose();
        }

        if (_connection != null)
        {
            await _connection.CloseAsync(cancellationToken: cancellationToken);
            _connection?.Dispose();
        }

        _logger.LogInformation("TrendingConsumer stopped");
        await base.StopAsync(cancellationToken);
    }
}