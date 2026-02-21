# Project Analysis and Improvement Plan

This plan addresses the issues found during the project analysis and provides guidance on how to run and test the microservices.

## Summary of Findings

- **Redundant Configuration**: `AuthService` has duplicate code for `DbContext` and `JwtBearer`.
- **Missing Gateway Routes**: `ChatService` and `RecommendPostService` are not yet routed through the API Gateway.
- **Missing Tests**: No unit or integration tests were found in the solution.

## Proposed Changes

### [Component] [AuthService](file:///d:/dev/The-Blog-Project/services/AuthService)

#### [MODIFY] [Program.cs](file:///d:/dev/The-Blog-Project/services/AuthService/Program.cs)
- Clean up redundant `AddDbContext` and `AddAuthentication` calls.
- Use `builder.Configuration.GetConnectionString("MySqlConnect")` consistently.
- Ensure only one JWT scheme is configured or distinguish them clearly.

### [Component] [ApiGateway](file:///d:/dev/The-Blog-Project/gateway/ApiGateway)

#### [MODIFY] [ocelot.json](file:///d:/dev/The-Blog-Project/gateway/ApiGateway/ocelot.json)
- Add route for `ChatService` to allow SignalR traffic.
- (Optional) Add route for `RecommendPostService` if it will expose any endpoints in the future.

### [Component] [Testing Infrastructure]

#### [NEW] [Test Strategy]
- Recommend creating a new project `The-Blog-Project.Tests`.
- Add xUnit, Moq, and FluentAssertions.
- Implement sample tests for `AuthService` logic.

## Verification Plan

### Automated Tests
- Run `dotnet build` to ensure all projects compile correctly after cleanup.
- Initialize a new test project and run `dotnet test`.

### Manual Verification
- Verify that `AuthService` still starts correctly and accepts requests.
- Test the new Gateway routes using a tool like Postman or `AuthService.http`.
