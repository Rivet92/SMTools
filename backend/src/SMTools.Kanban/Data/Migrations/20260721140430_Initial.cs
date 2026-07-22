using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SMTools.Kanban.Data.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "kanban");

            migrationBuilder.CreateTable(
                name: "KanbanRooms",
                schema: "kanban",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanRooms", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KanbanColumns",
                schema: "kanban",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "character varying(4096)", maxLength: 4096, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanColumns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KanbanColumns_KanbanRooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "kanban",
                        principalTable: "KanbanRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KanbanRoomParticipants",
                schema: "kanban",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConnectionId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsOwner = table.Column<bool>(type: "boolean", nullable: false),
                    IsAdmin = table.Column<bool>(type: "boolean", nullable: false),
                    IsConnected = table.Column<bool>(type: "boolean", nullable: false),
                    HasLeft = table.Column<bool>(type: "boolean", nullable: false),
                    JoinedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanRoomParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KanbanRoomParticipants_KanbanRooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "kanban",
                        principalTable: "KanbanRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KanbanCards",
                schema: "kanban",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    ColumnId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    Description = table.Column<string>(type: "character varying(4096)", maxLength: 4096, nullable: true),
                    AuthorParticipantId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedParticipantId = table.Column<Guid>(type: "uuid", nullable: true),
                    RepoUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    RepoBranch = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    InitialEstimation = table.Column<double>(type: "double precision", nullable: true),
                    Remaining = table.Column<double>(type: "double precision", nullable: true),
                    DueAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanCards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KanbanCards_KanbanColumns_ColumnId",
                        column: x => x.ColumnId,
                        principalSchema: "kanban",
                        principalTable: "KanbanColumns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KanbanCards_KanbanRoomParticipants_AssignedParticipantId",
                        column: x => x.AssignedParticipantId,
                        principalSchema: "kanban",
                        principalTable: "KanbanRoomParticipants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_KanbanCards_KanbanRoomParticipants_AuthorParticipantId",
                        column: x => x.AuthorParticipantId,
                        principalSchema: "kanban",
                        principalTable: "KanbanRoomParticipants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_KanbanCards_KanbanRooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "kanban",
                        principalTable: "KanbanRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KanbanCardComments",
                schema: "kanban",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CardId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorParticipantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "character varying(4096)", maxLength: 4096, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanCardComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KanbanCardComments_KanbanCards_CardId",
                        column: x => x.CardId,
                        principalSchema: "kanban",
                        principalTable: "KanbanCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KanbanCardComments_KanbanRoomParticipants_AuthorParticipant~",
                        column: x => x.AuthorParticipantId,
                        principalSchema: "kanban",
                        principalTable: "KanbanRoomParticipants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KanbanCardComments_AuthorParticipantId",
                schema: "kanban",
                table: "KanbanCardComments",
                column: "AuthorParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanCardComments_CardId",
                schema: "kanban",
                table: "KanbanCardComments",
                column: "CardId");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanCards_AssignedParticipantId",
                schema: "kanban",
                table: "KanbanCards",
                column: "AssignedParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanCards_AuthorParticipantId",
                schema: "kanban",
                table: "KanbanCards",
                column: "AuthorParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanCards_ColumnId",
                schema: "kanban",
                table: "KanbanCards",
                column: "ColumnId");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanCards_RoomId",
                schema: "kanban",
                table: "KanbanCards",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanColumns_RoomId_DisplayOrder",
                schema: "kanban",
                table: "KanbanColumns",
                columns: new[] { "RoomId", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_KanbanRoomParticipants_ConnectionId",
                schema: "kanban",
                table: "KanbanRoomParticipants",
                column: "ConnectionId",
                filter: "\"ConnectionId\" IS NOT NULL AND \"ConnectionId\" <> ''");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanRoomParticipants_RoomId",
                schema: "kanban",
                table: "KanbanRoomParticipants",
                column: "RoomId",
                unique: true,
                filter: "\"IsOwner\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanRoomParticipants_RoomId_UserId",
                schema: "kanban",
                table: "KanbanRoomParticipants",
                columns: new[] { "RoomId", "UserId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KanbanCardComments",
                schema: "kanban");

            migrationBuilder.DropTable(
                name: "KanbanCards",
                schema: "kanban");

            migrationBuilder.DropTable(
                name: "KanbanColumns",
                schema: "kanban");

            migrationBuilder.DropTable(
                name: "KanbanRoomParticipants",
                schema: "kanban");

            migrationBuilder.DropTable(
                name: "KanbanRooms",
                schema: "kanban");
        }
    }
}
