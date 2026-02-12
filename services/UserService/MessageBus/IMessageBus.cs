namespace UserService.MessageBus;

public interface IMessageBus
{
    void Publish(string queueName, object message);
}