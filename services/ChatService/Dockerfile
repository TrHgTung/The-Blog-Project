FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY ["services/ChatService/ChatService.csproj", "services/ChatService/"]
RUN dotnet restore "services/ChatService/ChatService.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/services/ChatService"
RUN dotnet build "ChatService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ChatService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ChatService.dll"]
