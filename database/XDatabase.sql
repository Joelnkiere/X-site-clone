CREATE TABLE "users" (
  "id" integer PRIMARY KEY,
  "name" varchar,
  "username" varchar UNIQUE NOT NULL,
  "email" varchar UNIQUE NOT NULL,
  "password" varchar,
  "phone" varchar,
  "profile_picture" varchar,
  "bio" text,
  "location" varchar,
  "website" varchar,
  "created_at" timestamp
);

CREATE TABLE "tweets" (
  "id" integer PRIMARY KEY,
  "content" text,
  "user_id" integer,
  "created_at" timestamp
);

CREATE TABLE "media" (
  "id" integer PRIMARY KEY,
  "type_media" varchar,
  "url" varchar,
  "user_id" integer,
  "tweet_id" integer
);

CREATE TABLE "likes" (
  "id" integer PRIMARY KEY,
  "user_id" integer,
  "tweet_id" integer,
  "created_at" timestamp
);

CREATE TABLE "retweets" (
  "id" integer PRIMARY KEY,
  "user_id" integer,
  "tweet_id" integer,
  "created_at" timestamp
);

CREATE TABLE "followers" (
  "id" integer PRIMARY KEY,
  "follower_id" integer,
  "followed_id" integer,
  "created_at" timestamp
);

ALTER TABLE "tweets" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "media" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "media" ADD FOREIGN KEY ("tweet_id") REFERENCES "tweets" ("id");

ALTER TABLE "likes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "likes" ADD FOREIGN KEY ("tweet_id") REFERENCES "tweets" ("id");

ALTER TABLE "retweets" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "retweets" ADD FOREIGN KEY ("tweet_id") REFERENCES "tweets" ("id");

ALTER TABLE "followers" ADD FOREIGN KEY ("follower_id") REFERENCES "users" ("id");

ALTER TABLE "followers" ADD FOREIGN KEY ("followed_id") REFERENCES "users" ("id");
