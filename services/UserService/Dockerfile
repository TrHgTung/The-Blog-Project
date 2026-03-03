FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY ["services/UserService/UserService.csproj", "services/UserService/"]
COPY ["shared/TheBlog.Shared/TheBlog.Shared.csproj", "shared/TheBlog.Shared/"]
RUN dotnet restore "services/UserService/UserService.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/services/UserService"
RUN dotnet build "UserService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "UserService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "UserService.dll"]
