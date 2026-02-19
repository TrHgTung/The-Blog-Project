# Project Improvement and Testing Guide

I have applied several fixes to the project and set up a basic testing infrastructure.

## Changes Made

### 1. AuthService Cleanup
- **Redundancy Removed**: Cleaned up duplicated `AddDbContext` and `AddAuthentication` calls in `Program.cs`.
- **MySQL Connection**: Switched to `ServerVersion.AutoDetect` for more flexible database connections instead of a hardcoded version.
- **JWT Fix**: Unified JWT configuration to use a single authentication scheme named `UserScheme`.

### 2. ApiGateway Enhancement
- **ChatService Routing**: Added a new route to `ocelot.json` to handle SignalR traffic for the `ChatService`.
- **Ports Verified**: Ensured the gateway points to the correct local ports defined in the services' `launchSettings.json`.

### 3. Testing Infrastructure
- **New Project**: Created `tests/The-Blog-Project.Tests` using xUnit.
- **Libraries Added**: Integrated `Moq` for mocking and `FluentAssertions` for better test readability.
- **Reference Added**: The test project is linked to `AuthService` for unit testing.

---

## How to Run the Project

### Prerequisites
1. **MySQL Server**: Ensure MySQL is running on port 3306.
2. **RabbitMQ**: Required for `UserService` and `RecommendPostService`.
3. **Email (Optional)**: Update `appsettings.json` in `AuthService` with your SMTP details if you want to test email features.

### Running Services
You can run all services or specific ones using the .NET CLI:

```powershell
# Run the Gateway
cd gateway/ApiGateway
dotnet run

# Run individual services (in separate terminals)
cd services/AuthService
dotnet run

cd services/UserService
dotnet run
```

---

## How to Run Tests

I have added a sample test project. You can run tests via the command line:

```powershell
# Navigate to the root directory
dotnet test
```

### Writing More Tests
You can add new test files in the `tests/The-Blog-Project.Tests` directory. I've added a sample test `AuthServiceTests.cs` to get you started.

````carousel
```csharp
// Example test in AuthServiceTests.cs
[Fact]
public void Test_Sample_Logic()
{
    // Arrange
    var value = true;

    // Act & Assert
    value.Should().BeTrue();
}
```
````
