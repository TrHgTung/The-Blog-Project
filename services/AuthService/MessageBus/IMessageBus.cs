namespace AuthService.MessageBus;

public interface IMessageBus
{
    Task Publish(string queueName, object message);
}
