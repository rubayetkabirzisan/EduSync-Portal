using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAttendanceStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Attendances",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Present");

            migrationBuilder.Sql(
                "UPDATE \"Attendances\" SET \"Status\" = CASE WHEN \"IsPresent\" THEN 'Present' ELSE 'Absent' END;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Attendances");
        }
    }
}
