# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies to cache the layers
COPY ["backend/src/Api/Api.csproj", "backend/src/Api/"]
COPY ["backend/src/Application/Application.csproj", "backend/src/Application/"]
COPY ["backend/src/Domain/Domain.csproj", "backend/src/Domain/"]
COPY ["backend/src/Infrastructure/Infrastructure.csproj", "backend/src/Infrastructure/"]
RUN dotnet restore "backend/src/Api/Api.csproj"

# Copy the rest of the backend source code and build
COPY backend/ backend/
WORKDIR "/src/backend/src/Api"
RUN dotnet build "Api.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Run (Lightweight Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Expose the API port
EXPOSE 5080

# Configure the runtime environment
ENV ASPNETCORE_URLS=http://+:5080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Api.dll"]
