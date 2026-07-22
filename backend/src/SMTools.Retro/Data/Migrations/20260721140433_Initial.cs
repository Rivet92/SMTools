using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SMTools.Retro.Data.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "retro");

            migrationBuilder.CreateTable(
                name: "RetroTemplates",
                schema: "retro",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "text", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RetroTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RetroColumns",
                schema: "retro",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    Color = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Icon = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RetroColumns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RetroColumns_RetroTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalSchema: "retro",
                        principalTable: "RetroTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RetroRooms",
                schema: "retro",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    Phase = table.Column<int>(type: "integer", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RetroRooms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RetroRooms_RetroTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalSchema: "retro",
                        principalTable: "RetroTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RetroCardGroups",
                schema: "retro",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RetroCardGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RetroCardGroups_RetroRooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "retro",
                        principalTable: "RetroRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RetroRoomParticipants",
                schema: "retro",
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
                    table.PrimaryKey("PK_RetroRoomParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RetroRoomParticipants_RetroRooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "retro",
                        principalTable: "RetroRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RetroActionItems",
                schema: "retro",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    AssigneeParticipantId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RetroActionItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RetroActionItems_RetroRoomParticipants_AssigneeParticipantId",
                        column: x => x.AssigneeParticipantId,
                        principalSchema: "retro",
                        principalTable: "RetroRoomParticipants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_RetroActionItems_RetroRooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "retro",
                        principalTable: "RetroRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RetroCards",
                schema: "retro",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    ColumnId = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: true),
                    Content = table.Column<string>(type: "text", nullable: false),
                    AuthorParticipantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RetroCards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RetroCards_RetroCardGroups_GroupId",
                        column: x => x.GroupId,
                        principalSchema: "retro",
                        principalTable: "RetroCardGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_RetroCards_RetroColumns_ColumnId",
                        column: x => x.ColumnId,
                        principalSchema: "retro",
                        principalTable: "RetroColumns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RetroCards_RetroRoomParticipants_AuthorParticipantId",
                        column: x => x.AuthorParticipantId,
                        principalSchema: "retro",
                        principalTable: "RetroRoomParticipants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RetroCards_RetroRooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "retro",
                        principalTable: "RetroRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RetroVotes",
                schema: "retro",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    CardId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParticipantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Points = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RetroVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RetroVotes_RetroCards_CardId",
                        column: x => x.CardId,
                        principalSchema: "retro",
                        principalTable: "RetroCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RetroVotes_RetroRoomParticipants_ParticipantId",
                        column: x => x.ParticipantId,
                        principalSchema: "retro",
                        principalTable: "RetroRoomParticipants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RetroVotes_RetroRooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "retro",
                        principalTable: "RetroRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RetroActionItems_AssigneeParticipantId",
                schema: "retro",
                table: "RetroActionItems",
                column: "AssigneeParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_RetroActionItems_RoomId",
                schema: "retro",
                table: "RetroActionItems",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_RetroCardGroups_RoomId",
                schema: "retro",
                table: "RetroCardGroups",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_RetroCards_AuthorParticipantId",
                schema: "retro",
                table: "RetroCards",
                column: "AuthorParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_RetroCards_ColumnId",
                schema: "retro",
                table: "RetroCards",
                column: "ColumnId");

            migrationBuilder.CreateIndex(
                name: "IX_RetroCards_GroupId",
                schema: "retro",
                table: "RetroCards",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_RetroCards_RoomId",
                schema: "retro",
                table: "RetroCards",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_RetroColumns_TemplateId",
                schema: "retro",
                table: "RetroColumns",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_RetroRoomParticipants_ConnectionId",
                schema: "retro",
                table: "RetroRoomParticipants",
                column: "ConnectionId",
                filter: "\"ConnectionId\" IS NOT NULL AND \"ConnectionId\" <> ''");

            migrationBuilder.CreateIndex(
                name: "IX_RetroRoomParticipants_RoomId",
                schema: "retro",
                table: "RetroRoomParticipants",
                column: "RoomId",
                unique: true,
                filter: "\"IsOwner\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_RetroRoomParticipants_RoomId_UserId",
                schema: "retro",
                table: "RetroRoomParticipants",
                columns: new[] { "RoomId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_RetroRooms_TemplateId",
                schema: "retro",
                table: "RetroRooms",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_RetroTemplates_Key",
                schema: "retro",
                table: "RetroTemplates",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RetroVotes_CardId_ParticipantId",
                schema: "retro",
                table: "RetroVotes",
                columns: new[] { "CardId", "ParticipantId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RetroVotes_ParticipantId",
                schema: "retro",
                table: "RetroVotes",
                column: "ParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_RetroVotes_RoomId",
                schema: "retro",
                table: "RetroVotes",
                column: "RoomId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RetroActionItems",
                schema: "retro");

            migrationBuilder.DropTable(
                name: "RetroVotes",
                schema: "retro");

            migrationBuilder.DropTable(
                name: "RetroCards",
                schema: "retro");

            migrationBuilder.DropTable(
                name: "RetroCardGroups",
                schema: "retro");

            migrationBuilder.DropTable(
                name: "RetroColumns",
                schema: "retro");

            migrationBuilder.DropTable(
                name: "RetroRoomParticipants",
                schema: "retro");

            migrationBuilder.DropTable(
                name: "RetroRooms",
                schema: "retro");

            migrationBuilder.DropTable(
                name: "RetroTemplates",
                schema: "retro");
        }
    }
}
