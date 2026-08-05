using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace AssignmentSystem.Infrastructure.Data;

// Used only by `dotnet ef` at design time (migrations add / database update).
// Resolution order mirrors what Program.cs sees at runtime: an explicit
// ConnectionStrings__DefaultConnection env var first, then this project's
// user-secrets (the same store `dotnet user-secrets set ... -p src/Api`
// writes to), then a local-Postgres fallback matching docker-compose.yml.
// Keeping this separate from Program.cs means `dotnet ef` never has to spin
// up the whole app (JWT config, seeding, etc.) just to read the model.
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

        if (string.IsNullOrEmpty(connectionString))
        {
            var config = new ConfigurationBuilder()
                .AddUserSecrets("assignment-system-api")
                .Build();
            connectionString = config["ConnectionStrings:DefaultConnection"];
        }

        connectionString ??= "Host=localhost;Port=5432;Database=assignment_system;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new AppDbContext(optionsBuilder.Options);
    }
}
