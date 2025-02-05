-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "created" DATETIME NOT NULL,
    "current_reveal_index" INTEGER NOT NULL,
    "can_start" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "socket_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "joined_at" DATETIME NOT NULL,
    "ready" BOOLEAN NOT NULL,
    "session_id" TEXT NOT NULL,
    CONSTRAINT "participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "participant_images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image_url" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    CONSTRAINT "participant_images_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
