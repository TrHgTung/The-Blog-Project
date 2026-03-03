using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace UserService.MessageBus;

public class RabbitMqMessageBus : IMessageBus
{
    private readonly IConnection _connection;
    private readonly IChannel _channel;

    private readonly IConfiguration _configuration;

    public RabbitMqMessageBus(IConfiguration configuration)
    {
        _configuration = configuration;
        var hostName = _configuration["RabbitMQ:HostName"] ?? "localhost";
        var factory = new ConnectionFactory()
        {
            HostName = hostName
        };

        _connection = factory.CreateConnectionAsync().GetAwaiter().GetResult();
        _channel = _connection.CreateChannelAsync().GetAwaiter().GetResult();
    }

    public async Task Publish(string queueName, object message)
    {
        await _channel.QueueDeclareAsync(
            queue: queueName,
            durable: false,
            exclusive: false,
            autoDelete: false,
            arguments: null
        );

        var body = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(message)
        );

        _channel.BasicPublishAsync(
            exchange: "",
            routingKey: queueName,
            // basicProperties: null,
            body: body
        );
    }
}
