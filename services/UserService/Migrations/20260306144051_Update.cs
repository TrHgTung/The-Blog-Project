using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UserService.Migrations
{
    /// <inheritdoc />
    public partial class Update : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "UPSInfo",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_UserTopics_UserId_Id",
                table: "UserTopics",
                columns: new[] { "UserId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_UPSInfo_UserId",
                table: "UPSInfo",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UPSInfo_Username",
                table: "UPSInfo",
                column: "Username");

            migrationBuilder.CreateIndex(
                name: "IX_TopicUserMembers_UserId_TopicId",
                table: "TopicUserMembers",
                columns: new[] { "UserId", "TopicId" });

            migrationBuilder.CreateIndex(
                name: "IX_ReplyComments_CommentPostId_UserId",
                table: "ReplyComments",
                columns: new[] { "CommentPostId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_PostTopics_Id_TopicId",
                table: "PostTopics",
                columns: new[] { "Id", "TopicId" });

            migrationBuilder.CreateIndex(
                name: "IX_CommentPosts_PostId_UserId",
                table: "CommentPosts",
                columns: new[] { "PostId", "UserId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserTopics_UserId_Id",
                table: "UserTopics");

            migrationBuilder.DropIndex(
                name: "IX_UPSInfo_UserId",
                table: "UPSInfo");

            migrationBuilder.DropIndex(
                name: "IX_UPSInfo_Username",
                table: "UPSInfo");

            migrationBuilder.DropIndex(
                name: "IX_TopicUserMembers_UserId_TopicId",
                table: "TopicUserMembers");

            migrationBuilder.DropIndex(
                name: "IX_ReplyComments_CommentPostId_UserId",
                table: "ReplyComments");

            migrationBuilder.DropIndex(
                name: "IX_PostTopics_Id_TopicId",
                table: "PostTopics");

            migrationBuilder.DropIndex(
                name: "IX_CommentPosts_PostId_UserId",
                table: "CommentPosts");

            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "UPSInfo",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
