using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SMTools.PlanningPoker.Data.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "planningpoker");

            migrationBuilder.CreateTable(
                name: "PlanningPokerDecks",
                schema: "planningpoker",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "text", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanningPokerDecks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlanningPokerCards",
                schema: "planningpoker",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    DeckId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanningPokerCards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanningPokerCards_PlanningPokerDecks_DeckId",
                        column: x => x.DeckId,
                        principalSchema: "planningpoker",
                        principalTable: "PlanningPokerDecks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlanningPokerRooms",
                schema: "planningpoker",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DeckId = table.Column<Guid>(type: "uuid", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanningPokerRooms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanningPokerRooms_PlanningPokerDecks_DeckId",
                        column: x => x.DeckId,
                        principalSchema: "planningpoker",
                        principalTable: "PlanningPokerDecks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlanningPokerRoomParticipants",
                schema: "planningpoker",
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
                    table.PrimaryKey("PK_PlanningPokerRoomParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanningPokerRoomParticipants_PlanningPokerRooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "planningpoker",
                        principalTable: "PlanningPokerRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlanningPokerVoteItems",
                schema: "planningpoker",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsRevealed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanningPokerVoteItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanningPokerVoteItems_PlanningPokerRooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "planningpoker",
                        principalTable: "PlanningPokerRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlanningPokerVotes",
                schema: "planningpoker",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    VoteItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParticipantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Value = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanningPokerVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanningPokerVotes_PlanningPokerRoomParticipants_Participan~",
                        column: x => x.ParticipantId,
                        principalSchema: "planningpoker",
                        principalTable: "PlanningPokerRoomParticipants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlanningPokerVotes_PlanningPokerRooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "planningpoker",
                        principalTable: "PlanningPokerRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlanningPokerVotes_PlanningPokerVoteItems_VoteItemId",
                        column: x => x.VoteItemId,
                        principalSchema: "planningpoker",
                        principalTable: "PlanningPokerVoteItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerCards_DeckId",
                schema: "planningpoker",
                table: "PlanningPokerCards",
                column: "DeckId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerDecks_Key",
                schema: "planningpoker",
                table: "PlanningPokerDecks",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerRoomParticipants_ConnectionId",
                schema: "planningpoker",
                table: "PlanningPokerRoomParticipants",
                column: "ConnectionId",
                filter: "\"ConnectionId\" IS NOT NULL AND \"ConnectionId\" <> ''");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerRoomParticipants_RoomId",
                schema: "planningpoker",
                table: "PlanningPokerRoomParticipants",
                column: "RoomId",
                unique: true,
                filter: "\"IsOwner\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerRoomParticipants_RoomId_UserId",
                schema: "planningpoker",
                table: "PlanningPokerRoomParticipants",
                columns: new[] { "RoomId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerRooms_DeckId",
                schema: "planningpoker",
                table: "PlanningPokerRooms",
                column: "DeckId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerVoteItems_RoomId",
                schema: "planningpoker",
                table: "PlanningPokerVoteItems",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerVotes_ParticipantId",
                schema: "planningpoker",
                table: "PlanningPokerVotes",
                column: "ParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerVotes_RoomId",
                schema: "planningpoker",
                table: "PlanningPokerVotes",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerVotes_VoteItemId_ParticipantId",
                schema: "planningpoker",
                table: "PlanningPokerVotes",
                columns: new[] { "VoteItemId", "ParticipantId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlanningPokerCards",
                schema: "planningpoker");

            migrationBuilder.DropTable(
                name: "PlanningPokerVotes",
                schema: "planningpoker");

            migrationBuilder.DropTable(
                name: "PlanningPokerRoomParticipants",
                schema: "planningpoker");

            migrationBuilder.DropTable(
                name: "PlanningPokerVoteItems",
                schema: "planningpoker");

            migrationBuilder.DropTable(
                name: "PlanningPokerRooms",
                schema: "planningpoker");

            migrationBuilder.DropTable(
                name: "PlanningPokerDecks",
                schema: "planningpoker");
        }
    }
}
