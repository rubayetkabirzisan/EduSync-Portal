using System.Text;
using AssignmentSystem.Api.Middleware;
using AssignmentSystem.Api.Services;
using AssignmentSystem.Application.DTOs.Auth;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Infrastructure.Data;
using AssignmentSystem.Infrastructure.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using Serilog;

// ── Bootstrap Serilog ──────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    // Load .env file for Supabase connection string BEFORE builder is created
    DotNetEnv.Env.Load("../../.env");
    DotNetEnv.Env.Load("../.env");
    DotNetEnv.Env.Load();

    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog ────────────────────────────────────────────────────
    builder.Host.UseSerilog((context, config) => config
        .ReadFrom.Configuration(context.Configuration)
        .WriteTo.Console());

    // ── Database ───────────────────────────────────────────────────
    var connString = builder.Configuration.GetConnectionString("DefaultConnection");
    Log.Information("Connecting to database: " + connString?.Split(';').FirstOrDefault());
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connString));

    // ── Application Services ───────────────────────────────────────
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IUserService, UserService>();
    builder.Services.AddScoped<IClassService, ClassService>();
    builder.Services.AddScoped<ISubjectService, SubjectService>();
    builder.Services.AddScoped<ITeachingAssignmentService, TeachingAssignmentService>();
    builder.Services.AddScoped<IAssignmentService, AssignmentService>();
    builder.Services.AddScoped<ISubmissionService, SubmissionService>();
    builder.Services.AddScoped<INoticeService, NoticeService>();
    builder.Services.AddScoped<ILeaveApplicationService, LeaveApplicationService>();
    builder.Services.AddScoped<IScholarshipService, ScholarshipService>();
    builder.Services.AddScoped<ILiveNotificationService, LiveNotificationService>();
    builder.Services.AddScoped<IExamService, ExamService>();
    builder.Services.AddScoped<IAiAdvisorService, AiAdvisorService>();
    builder.Services.AddScoped<IAttendanceService, AttendanceService>();
    builder.Services.AddScoped<IDashboardService, DashboardService>();
    builder.Services.AddScoped<IUserService, UserService>();
    
    // ── Chatbot Service ─────────────────────────────────────────────
    builder.Services.AddHttpClient<IChatbotService, ChatbotService>(client =>
    {
        var baseUrl = builder.Configuration["ChatbotApiBaseUrl"] ?? "http://localhost:8000/api/";
        client.BaseAddress = new Uri(baseUrl);
    });

    // ── Notifications ───────────────────────────────────────────────
    builder.Services.AddOptions();
    builder.Services.AddHttpClient<Resend.ResendClient>();
    builder.Services.Configure<Resend.ResendClientOptions>(o =>
    {
        o.ApiToken = builder.Configuration["Resend:ApiKey"] ?? "";
    });
    builder.Services.AddTransient<Resend.IResend, Resend.ResendClient>();
    builder.Services.AddScoped<INotificationService, NotificationService>();

    // ── FluentValidation ───────────────────────────────────────────
    builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

    // ── JWT Authentication ─────────────────────────────────────────
    var jwtSecret = builder.Configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException(
            "Jwt:Secret is not configured. Set it in appsettings.Development.json or via " +
            "'dotnet user-secrets set \"Jwt:Secret\" \"...\" -p src/Api'.");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = builder.Configuration["Jwt:Audience"],
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            };
        });

    builder.Services.AddAuthorization();

    // ── CORS ───────────────────────────────────────────────────────
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? new[] { "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002" };
            policy.WithOrigins(origins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    // ── Controllers + Swagger + API Standards ──────────────────────
    builder.Services.AddControllers();
    builder.Services.AddSignalR();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddProblemDetails();
    builder.Services.AddHealthChecks();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Assignment System API",
            Version = "v1",
            Description = "Role-based Assignment & Submission Management System"
        });

        var securityScheme = new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Paste just the raw token — Swagger adds the 'Bearer ' prefix for you.",
            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
        };
        options.AddSecurityDefinition("Bearer", securityScheme);
        options.AddSecurityRequirement(new OpenApiSecurityRequirement { { securityScheme, Array.Empty<string>() } });
    });

    var app = builder.Build();

    // ── Middleware Pipeline ─────────────────────────────────────────
    app.UseMiddleware<GlobalExceptionMiddleware>();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    // Auto-migrate + seed on startup
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            await db.Database.MigrateAsync();
        }
        catch (PostgresException ex) when (ex.SqlState == "42P07")
        {
            Log.Warning("Database tables already exist in Supabase/PostgreSQL. Syncing migration history...");
            try
            {
                await db.Database.ExecuteSqlRawAsync(
                    "INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ('20260807082704_InitialCreate', '10.0.0') ON CONFLICT DO NOTHING;");
            }
            catch (Exception recordEx)
            {
                Log.Warning(recordEx, "Could not record migration history; continuing with existing schema.");
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Migration encountered an exception; attempting to seed and continue...");
        }

        try
        {
            await DbSeeder.SeedAsync(db);
        }
        catch (Exception seedEx)
        {
            Log.Warning(seedEx, "Database seeding skipped or partially failed.");
        }
    }

    app.UseCors();
    app.UseHttpsRedirection();
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapHub<AssignmentSystem.Api.Hubs.ChatHub>("/chatHub");
    app.MapHub<AssignmentSystem.Api.Hubs.NotificationHub>("/notificationHub");
    app.MapHealthChecks("/health");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
