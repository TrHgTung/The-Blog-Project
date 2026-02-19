using FluentAssertions;
using Xunit;

namespace The_Blog_Project.Tests;

public class AuthServiceTests
{
    [Fact]
    public void SampleTest_ToVerify_Setup()
    {
        // Arrange
        var message = "Hello Blog Project";

        // Act
        var length = message.Length;

        // Assert
        length.Should().Be(18);
    }
}
