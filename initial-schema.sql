CREATE TABLE "users" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "username" TEXT,
    "password" TEXT, -- sha256 hash of the plain-text password
    "salt" TEXT, -- salt that is appended to the password before it is hashed
	"full_name" TEXT,
	"email" TEXT,
	"date" DATETIME
);

CREATE TABLE "models" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "owner_username" TEXT,
    "name" TEXT,
	"description" TEXT,
    "json_state" TEXT,
	"date" DATETIME
);

CREATE TABLE "stars" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"model_id" INTEGER,
    "user_id" INTEGER,
	"date" DATETIME,
	FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE, 
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
