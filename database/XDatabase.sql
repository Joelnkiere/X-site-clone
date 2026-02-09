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


INSERT INTO users (id, name, username, email, password, phone, profile_picture, bio, location, website, created_at) VALUES
(1, 'Jean-Pierre Mukendi', 'jpmukendi', 'jpmukendi@gmail.com', 'hashed_pwd1', '+243812345678', 'jp.jpg', 'Développeur web à Kin', 'Kinshasa', 'https://jpmukendi.dev', NOW()),
(2, 'Grace Tshibangu', 'gracetshi', 'grace.tshi@gmail.com', 'hashed_pwd2', '+243899112233', 'grace.jpg', 'Designer UI/UX', 'Lubumbashi', NULL, NOW()),
(3, 'Patrick Ilunga', 'ilungap', 'patrick.ilunga@gmail.com', 'hashed_pwd3', '+243820334455', 'patrick.jpg', 'Entrepreneur tech', 'Goma', NULL, NOW()),
(4, 'Sarah Kalala', 'sarahkalala', 'sarah.kalala@gmail.com', 'hashed_pwd4', '+243971223344', 'sarah.jpg', 'Community manager', 'Kinshasa', NULL, NOW());

INSERT INTO tweets (id, content, user_id, created_at) VALUES
(1, 'Le numérique est l’avenir de la RDC 🇨🇩', 1, NOW()),
(2, 'Nouveau design terminé pour un client local', 2, NOW()),
(3, 'Entreprendre au Congo est un vrai défi, mais possible.', 3, NOW()),
(4, 'Formation en développement web ce week-end à Kin.', 1, NOW());

INSERT INTO media (id, type_media, url, user_id, tweet_id) VALUES
(1, 'image', 'media/tweet1.jpg', 1, 1),
(2, 'image', 'media/tweet2.png', 2, 2),
(3, 'video', 'media/tweet3.mp4', 3, 3);

INSERT INTO likes (id, user_id, tweet_id, created_at) VALUES
(1, 2, 1, NOW()),
(2, 3, 1, NOW()),
(3, 1, 2, NOW()),
(4, 4, 3, NOW());

INSERT INTO retweets (id, user_id, tweet_id, created_at) VALUES
(1, 2, 1, NOW()),
(2, 4, 1, NOW()),
(3, 1, 3, NOW());

INSERT INTO followers (id, follower_id, followed_id, created_at) VALUES
(1, 2, 1, NOW()), -- Grace suit Jean-Pierre
(2, 3, 1, NOW()), -- Patrick suit Jean-Pierre
(3, 4, 2, NOW()), -- Sarah suit Grace
(4, 1, 3, NOW()); -- Jean-Pierre suit Patrick

