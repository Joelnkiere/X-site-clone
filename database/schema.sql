-- ============================================
-- STRUCTURE DE BASE DE DONNÉES POSTGRESQL
-- Pour le projet X-site-clone
-- ============================================

-- Table des utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    bio TEXT,
    location VARCHAR(100),
    website VARCHAR(255),
    profile_picture VARCHAR(500),
    banner_picture VARCHAR(500),
    followers INT DEFAULT 0,
    following INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des médias
CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video')), -- Type de média
    url TEXT NOT NULL,
    file_path VARCHAR(500),
    file_size INT,
    mime_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des tweets
CREATE TABLE tweets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes INT DEFAULT 0,
    retweets INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    reply_to INT REFERENCES tweets(id) ON DELETE CASCADE, -- Auto-référence pour les réponses
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison tweet-média (relation many-to-many)
CREATE TABLE tweet_media (
    id SERIAL PRIMARY KEY,
    tweet_id INT NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
    media_id INT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    position INT, -- Position du média dans le tweet
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tweet_id, media_id)
);

-- Table des likes (j'aime)
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tweet_id INT NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tweet_id) -- Un utilisateur ne peut liker qu'une fois par tweet
);

-- Table des retweets (partages)
CREATE TABLE retweets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tweet_id INT NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tweet_id) -- Un utilisateur ne peut retweeter qu'une fois par tweet
);

-- Table des signets (bookmarks)
CREATE TABLE bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tweet_id INT NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tweet_id) -- Un utilisateur ne peut marquer qu'une fois par tweet
);

-- Table des relations de suivi (followers/following)
CREATE TABLE follows (
    id SERIAL PRIMARY KEY,
    follower_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id) -- Un utilisateur ne peut pas se suivre lui-même
);

-- ============================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- ============================================

-- Index pour les recherches fréquentes
CREATE INDEX idx_tweets_user_id ON tweets(user_id);
CREATE INDEX idx_tweets_created_at ON tweets(created_at DESC);
CREATE INDEX idx_tweets_reply_to ON tweets(reply_to);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_tweet_id ON likes(tweet_id);
CREATE INDEX idx_retweets_user_id ON retweets(user_id);
CREATE INDEX idx_retweets_tweet_id ON retweets(tweet_id);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_tweet_id ON bookmarks(tweet_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_tweet_media_tweet_id ON tweet_media(tweet_id);
CREATE INDEX idx_tweet_media_media_id ON tweet_media(media_id);

-- ============================================
-- DONNÉES D'EXEMPLE
-- ============================================

INSERT INTO users (username, name, email, password, bio, location, followers, following)
VALUES 
    ('johndoe', 'John Doe', 'john.doe@example.com', '$2b$10$...', 'Passionate about coding and open source.', 'Goma, DRC', 200, 180),
    ('alicedoe', 'Alice Doe', 'alice@example.com', '$2b$10$...', 'Designer and artist.', 'Lubumbashi, DRC', 80, 60),
    ('joelnkiere', 'Joel Nkiere', 'joel@example.com', '$2b$10$...', '', '', 0, 0);

INSERT INTO tweets (user_id, content, likes, retweets)
VALUES
    (1, 'Hello, this is my first tweet!', 10, 5),
    (1, 'Just had a great day at the park!', 20, 10),
    (2, '@johndoe Welcome to Twitter!', 5, 1),
    (3, 'Je suis sur le réseau social', 0, 0);

-- Ajouter une réponse
UPDATE tweets SET reply_to = 1 WHERE id = 3;
UPDATE tweets SET reply_count = reply_count + 1 WHERE id = 1;

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue pour afficher les tweets avec les informations de l'auteur
CREATE VIEW tweets_with_author AS
SELECT 
    t.id,
    t.user_id,
    u.username,
    u.name as author_name,
    u.profile_picture,
    t.content,
    t.likes,
    t.retweets,
    t.reply_count,
    t.reply_to,
    t.created_at
FROM tweets t
JOIN users u ON t.user_id = u.id;

-- Vue pour les statistiques des utilisateurs
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.name,
    COUNT(DISTINCT t.id) as tweet_count,
    COUNT(DISTINCT l.id) as liked_tweets,
    COUNT(DISTINCT r.id) as retweeted_tweets,
    COUNT(DISTINCT b.id) as bookmarked_tweets
FROM users u
LEFT JOIN tweets t ON u.id = t.user_id
LEFT JOIN likes l ON u.id = l.user_id
LEFT JOIN retweets r ON u.id = r.user_id
LEFT JOIN bookmarks b ON u.id = b.user_id
GROUP BY u.id;

-- ============================================
-- FONCTIONS UTILES
-- ============================================

-- Fonction pour calculer les tweets les plus récents
CREATE OR REPLACE FUNCTION get_timeline(p_user_id INT, p_limit INT DEFAULT 20, p_offset INT DEFAULT 0)
RETURNS TABLE(
    tweet_id INT,
    author_id INT,
    username VARCHAR,
    author_name VARCHAR,
    profile_picture VARCHAR,
    content TEXT,
    likes INT,
    retweets INT,
    reply_count INT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, t.user_id, u.username, u.name, u.profile_picture,
        t.content, t.likes, t.retweets, t.reply_count, t.created_at
    FROM tweets t
    JOIN users u ON t.user_id = u.id
    WHERE t.reply_to IS NULL
    ORDER BY t.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les réponses d'un tweet
CREATE OR REPLACE FUNCTION get_tweet_replies(p_tweet_id INT)
RETURNS TABLE(
    tweet_id INT,
    author_id INT,
    username VARCHAR,
    author_name VARCHAR,
    content TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, t.user_id, u.username, u.name, t.content, t.created_at
    FROM tweets t
    JOIN users u ON t.user_id = u.id
    WHERE t.reply_to = p_tweet_id
    ORDER BY t.created_at ASC;
END;
$$ LANGUAGE plpgsql;
