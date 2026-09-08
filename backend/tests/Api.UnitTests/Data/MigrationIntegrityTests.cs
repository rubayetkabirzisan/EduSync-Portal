using System.Reflection;
using Infrastructure.Migrations;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Xunit;

namespace Api.UnitTests.Data;

public class MigrationIntegrityTests
{
    [Fact]
    public void AddExams_CreatesTheExamsTableBeforeLaterMigrationsAlterIt()
    {
        var migration = new AddExams();
        var builder = new MigrationBuilder("Npgsql.EntityFrameworkCore.PostgreSQL");
        var upMethod = typeof(AddExams).GetMethod(
            "Up",
            BindingFlags.Instance | BindingFlags.NonPublic);

        Assert.NotNull(upMethod);
        upMethod.Invoke(migration, [builder]);

        var createTable = Assert.Single(
            builder.Operations.OfType<CreateTableOperation>(),
            operation => operation.Name == "Exams");

        Assert.Contains(createTable.Columns, column => column.Name == "Id");
        Assert.Contains(createTable.Columns, column => column.Name == "ClassId");
        Assert.Contains(createTable.Columns, column => column.Name == "SubjectId");
        Assert.Contains(createTable.Columns, column => column.Name == "StartTime");
        Assert.Contains(createTable.Columns, column => column.Name == "EndTime");
        Assert.Contains(createTable.Columns, column => column.Name == "RoomNumber");
        Assert.DoesNotContain(createTable.Columns, column => column.Name == "MaxMarks");
    }
}
