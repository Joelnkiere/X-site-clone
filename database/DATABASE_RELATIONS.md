# Relations de Base de Données - X-Site-Clone

## 📊 Diagramme des Relations

```
┌─────────────┐
│   USERS     │
│─────────────│
│ id (PK)     │
│ username    │
│ name        │
│ email       │
│ password    │
│ profile_pic │
└──────┬──────┘
       │
       ├─────────────────────────────────────────┐
       │                                         │
       │ (1 user : N tweets)                    │ (1 user : N likes)
       │                                         │
       ▼                                         ▼
┌──────────────┐                          ┌──────────────┐
│   TWEETS     │                          │    LIKES     │
│──────────────│                          │──────────────│
│ id (PK)      │◄──┐                      │ id (PK)      │
│ user_id (FK) │   │ (1 tweet : N likes)  │ user_id (FK) │──┐
│ content      │   │                      │ tweet_id (FK)│  │
│ likes (count)│   │                      │ created_at   │  │
│ retweets     │   └──────────────────────┴──────────────┘  │
│ reply_to (FK)│                                            │
│ created_at   │       ┌──────────────────────────────────┘
└──────────────┘       │
       ▲               │
       │ (self-ref)    │ (belongs to)
       │               │
       │     ┌─────────┴────────────────────────────────┐
       │     │ (1 user : N retweets)                    │
       │     │ (1 user : N bookmarks)                   │
       │     │                                          │
       │     ▼                                          ▼
       │ ┌──────────────┐                       ┌──────────────┐
       │ │  RETWEETS    │                       │  BOOKMARKS   │
       │ │──────────────│                       │──────────────│
       │ │ id (PK)      │                       │ id (PK)      │
       │ │ user_id (FK) │                       │ user_id (FK) │
       │ │ tweet_id(FK) │                       │ tweet_id(FK) │
       │ │ created_at   │                       │ created_at   │
       │ └──────────────┘                       └──────────────┘
       │
       └─────────────────────────────────────────────────┐
                                                         │
                    ┌────────────────────────────────────┤
                    │ (1 tweet : N tweet_media)          │
                    │                                    │
                    ▼                                    ▼
            ┌──────────────────┐              ┌──────────────────┐
            │  TWEET_MEDIA     │              │     MEDIA        │
            │──────────────────│              │──────────────────│
            │ id (PK)          │              │ id (PK)          │
            │ tweet_id (FK)────┼──────────────├──────────┐       │
            │ media_id (FK)────┼──────────────┤──┐       │       │
            │ position         │              │  │       │       │
            │ created_at       │              └──┼───────┘       │
            └──────────────────┘                 │ (1 media : N  │
                                                 │  tweet_media) │
                                                 │               │
                                            ┌────┴───────────────┘
                                            │
                                            │ type: image|video
                                            │ url: file path
                                            │ file_size
                                            │ mime_type

┌──────────────────────────────────────────────────────────┐
│            FOLLOWS (Self-Referencing)                    │
│──────────────────────────────────────────────────────────│
│ id (PK)                                                  │
│ follower_id (FK) ─────► USERS(id)                       │
│ following_id (FK) ────► USERS(id)                       │
│ created_at                                               │
│ UNIQUE(follower_id, following_id)                       │
│ CHECK (follower_id != following_id)                     │
└──────────────────────────────────────────────────────────┘
```

## 📋 Tableau des Relations

| Table Source | Clé Étrangère | Table Cible | Type | Cascade |
|---|---|---|---|---|
| `tweets` | `user_id` | `users(id)` | Many-to-One | ON DELETE CASCADE |
| `tweets` | `reply_to` | `tweets(id)` | Self-Reference | ON DELETE CASCADE |
| `tweet_media` | `tweet_id` | `tweets(id)` | Many-to-Many | ON DELETE CASCADE |
| `tweet_media` | `media_id` | `media(id)` | Many-to-Many | ON DELETE CASCADE |
| `likes` | `user_id` | `users(id)` | Many-to-Many | ON DELETE CASCADE |
| `likes` | `tweet_id` | `tweets(id)` | Many-to-Many | ON DELETE CASCADE |
| `retweets` | `user_id` | `users(id)` | Many-to-Many | ON DELETE CASCADE |
| `retweets` | `tweet_id` | `tweets(id)` | Many-to-Many | ON DELETE CASCADE |
| `bookmarks` | `user_id` | `users(id)` | Many-to-Many | ON DELETE CASCADE |
| `bookmarks` | `tweet_id` | `tweets(id)` | Many-to-Many | ON DELETE CASCADE |
| `follows` | `follower_id` | `users(id)` | Many-to-Many (Self) | ON DELETE CASCADE |
| `follows` | `following_id` | `users(id)` | Many-to-Many (Self) | ON DELETE CASCADE |

## 🔗 Détail des Relations

### 1️⃣ **USERS → TWEETS** (One-to-Many)
- **Clé Étrangère** : `tweets.user_id` → `users.id`
- **Signification** : Un utilisateur peut créer plusieurs tweets
- **Cascade** : Si un utilisateur est supprimé, tous ses tweets sont supprimés

```sql
ALTER TABLE tweets 
ADD CONSTRAINT fk_tweets_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

### 2️⃣ **TWEETS → TWEETS** (Self-Referencing - Réponses)
- **Clé Étrangère** : `tweets.reply_to` → `tweets.id`
- **Signification** : Un tweet peut être une réponse à un autre tweet
- **Cascade** : Si le tweet original est supprimé, les réponses sont supprimées

```sql
ALTER TABLE tweets 
ADD CONSTRAINT fk_tweets_reply_to 
FOREIGN KEY (reply_to) REFERENCES tweets(id) ON DELETE CASCADE;
```

### 3️⃣ **TWEETS ↔ MEDIA** (Many-to-Many)
- **Table de Jonction** : `tweet_media`
- **Clés Étrangères** : 
  - `tweet_media.tweet_id` → `tweets.id`
  - `tweet_media.media_id` → `media.id`
- **Signification** : Un tweet peut avoir plusieurs médias, un média peut appartenir à plusieurs tweets
- **Cascade** : Si un tweet est supprimé, les liaisons sont supprimées

```sql
ALTER TABLE tweet_media 
ADD CONSTRAINT fk_tweet_media_tweet 
FOREIGN KEY (tweet_id) REFERENCES tweets(id) ON DELETE CASCADE;

ALTER TABLE tweet_media 
ADD CONSTRAINT fk_tweet_media_media 
FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE;
```

### 4️⃣ **USERS ↔ TWEETS (via LIKES)** (Many-to-Many)
- **Table de Jonction** : `likes`
- **Clés Étrangères** :
  - `likes.user_id` → `users.id`
  - `likes.tweet_id` → `tweets.id`
- **Signification** : Un utilisateur peut aimer plusieurs tweets, un tweet peut être aimé par plusieurs utilisateurs
- **Contrainte UNIQUE** : Un utilisateur ne peut aimer qu'une fois par tweet

```sql
ALTER TABLE likes 
ADD CONSTRAINT fk_likes_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE likes 
ADD CONSTRAINT fk_likes_tweet 
FOREIGN KEY (tweet_id) REFERENCES tweets(id) ON DELETE CASCADE;

ALTER TABLE likes 
ADD CONSTRAINT unique_user_tweet_like 
UNIQUE(user_id, tweet_id);
```

### 5️⃣ **USERS ↔ TWEETS (via RETWEETS)** (Many-to-Many)
- **Table de Jonction** : `retweets`
- **Clés Étrangères** :
  - `retweets.user_id` → `users.id`
  - `retweets.tweet_id` → `tweets.id`
- **Signification** : Un utilisateur peut retweeter plusieurs tweets, un tweet peut être retweeté par plusieurs utilisateurs
- **Contrainte UNIQUE** : Un utilisateur ne peut retweeter qu'une fois par tweet

```sql
ALTER TABLE retweets 
ADD CONSTRAINT fk_retweets_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE retweets 
ADD CONSTRAINT fk_retweets_tweet 
FOREIGN KEY (tweet_id) REFERENCES tweets(id) ON DELETE CASCADE;

ALTER TABLE retweets 
ADD CONSTRAINT unique_user_tweet_retweet 
UNIQUE(user_id, tweet_id);
```

### 6️⃣ **USERS ↔ TWEETS (via BOOKMARKS)** (Many-to-Many)
- **Table de Jonction** : `bookmarks`
- **Clés Étrangères** :
  - `bookmarks.user_id` → `users.id`
  - `bookmarks.tweet_id` → `tweets.id`
- **Signification** : Un utilisateur peut marquer plusieurs tweets, un tweet peut être marqué par plusieurs utilisateurs
- **Contrainte UNIQUE** : Un utilisateur ne peut marquer qu'une fois par tweet

```sql
ALTER TABLE bookmarks 
ADD CONSTRAINT fk_bookmarks_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE bookmarks 
ADD CONSTRAINT fk_bookmarks_tweet 
FOREIGN KEY (tweet_id) REFERENCES tweets(id) ON DELETE CASCADE;

ALTER TABLE bookmarks 
ADD CONSTRAINT unique_user_tweet_bookmark 
UNIQUE(user_id, tweet_id);
```

### 7️⃣ **USERS ↔ USERS (via FOLLOWS)** (Many-to-Many Self-Referencing)
- **Table de Jonction** : `follows`
- **Clés Étrangères** :
  - `follows.follower_id` → `users.id`
  - `follows.following_id` → `users.id`
- **Signification** : Un utilisateur peut suivre plusieurs utilisateurs, un utilisateur peut être suivi par plusieurs utilisateurs
- **Contraintes** :
  - UNIQUE : Un utilisateur ne peut suivre qu'une fois
  - CHECK : Un utilisateur ne peut pas se suivre lui-même

```sql
ALTER TABLE follows 
ADD CONSTRAINT fk_follows_follower 
FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE follows 
ADD CONSTRAINT fk_follows_following 
FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE follows 
ADD CONSTRAINT unique_follow 
UNIQUE(follower_id, following_id);

ALTER TABLE follows 
ADD CONSTRAINT check_not_self_follow 
CHECK (follower_id != following_id);
```

## 📑 Résumé des Clés Étrangères

- ✅ `tweets.user_id` → `users.id` 
- ✅ `tweets.reply_to` → `tweets.id` (Self-Reference)
- ✅ `tweet_media.tweet_id` → `tweets.id`
- ✅ `tweet_media.media_id` → `media.id`
- ✅ `likes.user_id` → `users.id`
- ✅ `likes.tweet_id` → `tweets.id`
- ✅ `retweets.user_id` → `users.id`
- ✅ `retweets.tweet_id` → `tweets.id`
- ✅ `bookmarks.user_id` → `users.id`
- ✅ `bookmarks.tweet_id` → `tweets.id`
- ✅ `follows.follower_id` → `users.id`
- ✅ `follows.following_id` → `users.id`

## 🎯 Intégrité Référentielle

Tous les DELETE utilisent **ON DELETE CASCADE** pour garantir l'intégrité :
- Quand un utilisateur est supprimé → tous ses tweets, likes, retweets et signets sont supprimés
- Quand un tweet est supprimé → toutes ses réponses, likes, retweets et signets sont supprimés
- Quand un média est supprimé → toutes les liaisons tweet_media sont supprimées
