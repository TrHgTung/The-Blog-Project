using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace AuthService.MessageBus;

public class RabbitMqMessageBus : IMessageBus
{
    private readonly IConnection _connection;
    private readonly IChannel _channel;
    private readonly IConfiguration _configuration;

    public RabbitMqMessageBus(IConfiguration configuration)
    {
        _configuration = configuration;
        var hostName = _configuration["RabbitMQ:HostName"] ?? "127.0.0.1";
        var factory = new ConnectionFactory()
        {
            HostName = hostName
        };

        int retries = 5;
        while (retries > 0)
        {
            try
            {
                _connection = factory.CreateConnectionAsync().GetAwaiter().GetResult();
                _channel = _connection.CreateChannelAsync().GetAwaiter().GetResult();
                break;
            }
            catch (Exception)
            {
                retries--;
                if (retries == 0) throw;
                Thread.Sleep(2000);
            }
        }
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

        await _channel.BasicPublishAsync(
            exchange: "",
            routingKey: queueName,
            body: body
        );
    }
}
