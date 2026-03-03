FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY ["services/RecommendPostService/RecommendPostService.csproj", "services/RecommendPostService/"]
COPY ["shared/TheBlog.Shared/TheBlog.Shared.csproj", "shared/TheBlog.Shared/"]
RUN dotnet restore "services/RecommendPostService/RecommendPostService.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/services/RecommendPostService"
RUN dotnet build "RecommendPostService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RecommendPostService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "RecommendPostService.dll"]
