// ============================================
// MODULE DE GESTION DES TWEETS
// ============================================

const API_BASE_URL = 'http://localhost:3000';

const TweetService = {
    // Formater une date relative (ex: "il y a 2h")
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'à l\'instant';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `il y a ${minutes}${minutes === 1 ? ' minute' : ' minutes'}`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `il y a ${hours}${hours === 1 ? ' heure' : ' heures'}`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `il y a ${days}${days === 1 ? ' jour' : ' jours'}`;
        } else {
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        }
    },

    // Formater une date complète
    formatFullDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Récupérer tous les utilisateurs
    async getUsers() {
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            return [];
        }
    },

    // Récupérer un utilisateur par ID
    async getUserById(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            return null;
        }
    },

    // Récupérer tous les tweets
    async getTweets() {
        try {
            const response = await fetch(`${API_BASE_URL}/tweets?_sort=createdAt&_order=desc`);
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des tweets:', error);
            return [];
        }
    },

    // Récupérer un tweet par ID
    async getTweetById(tweetId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tweets/${tweetId}`);
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération du tweet:', error);
            return null;
        }
    },

    // Récupérer les réponses d'un tweet
    async getReplies(tweetId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tweets?replyTo=${tweetId}&_sort=createdAt&_order=asc`);
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des réponses:', error);
            return [];
        }
    },

    // Récupérer les tweets d'un utilisateur
    async getUserTweets(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tweets?userId=${userId}&replyTo=&_sort=createdAt&_order=desc`);
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des tweets de l\'utilisateur:', error);
            return [];
        }
    },

    // Créer un nouveau tweet
    async createTweet(tweetData) {
        try {
            // Récupérer le prochain ID
            const tweets = await this.getTweets();
            const nextId = tweets.length > 0 ? Math.max(...tweets.map(t => t.id)) + 1 : 1;

            const newTweet = {
                id: nextId,
                userId: tweetData.userId,
                content: tweetData.content,
                media: tweetData.media || [],
                likes: 0,
                retweets: 0,
                replies: [],
                createdAt: new Date().toISOString(),
                replyTo: tweetData.replyTo || null
            };

            const response = await fetch(`${API_BASE_URL}/tweets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTweet)
            });

            if (response.ok) {
                const createdTweet = await response.json();

                // Si c'est une réponse, mettre à jour le tweet parent
                if (tweetData.replyTo) {
                    const parentTweet = await this.getTweetById(tweetData.replyTo);
                    if (parentTweet) {
                        const updatedReplies = [...(parentTweet.replies || []), createdTweet.id];
                        await fetch(`${API_BASE_URL}/tweets/${tweetData.replyTo}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ replies: updatedReplies })
                        });
                    }
                }

                return createdTweet;
            } else {
                throw new Error('Erreur lors de la création du tweet');
            }
        } catch (error) {
            console.error('Erreur lors de la création du tweet:', error);
            throw error;
        }
    },

    // Supprimer un tweet
    async deleteTweet(tweetId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tweets/${tweetId}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Erreur lors de la suppression du tweet:', error);
            return false;
        }
    },

    // Mettre à jour un tweet (pour likes, retweets, etc.)
    async updateTweet(tweetId, updates) {
        try {
            const response = await fetch(`${API_BASE_URL}/tweets/${tweetId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la mise à jour du tweet:', error);
            return null;
        }
    },

    // Créer un élément de tweet HTML
    createTweetElement(tweet, user, currentUserId = null) {
        const tweetElement = document.createElement('article');
        tweetElement.className = 'carte-tweet';
        tweetElement.dataset.tweetId = tweet.id;

        const avatarUrl = user.profilePicture || 'images/user-avatar.png';
        const relativeTime = this.formatRelativeTime(tweet.createdAt);
        const isOwner = currentUserId && tweet.userId === currentUserId;

        tweetElement.innerHTML = `
            <section class="avatar-tweet">
                <img src="${avatarUrl}" alt="Avatar de ${user.name}" class="avatar" onerror="this.src='images/user-avatar.png'">
            </section>
            <section class="contenu-tweet">
                <header class="en-tete-tweet">
                    <span class="nom-auteur">${this.escapeHtml(user.name)}</span>
                    <span class="nom-utilisateur">@${this.escapeHtml(user.username)}</span>
                    <span class="date-tweet">· ${relativeTime}</span>
                    ${isOwner ? `<button class="bouton-supprimer-tweet" data-tweet-id="${tweet.id}" title="Supprimer">🗑️</button>` : ''}
                </header>
                <p class="texte-tweet">${this.escapeHtml(tweet.content)}</p>
                ${tweet.media && tweet.media.length > 0 ? this.createMediaHTML(tweet.media) : ''}
                <nav class="actions-tweet">
                    <a href="tweet-detail.html?id=${tweet.id}" class="bouton-action" aria-label="Répondre">
                        <span class="icone-action">💬</span>
                        <span class="compteur-action">${tweet.replies ? tweet.replies.length : 0}</span>
                    </a>
                    <button class="bouton-action bouton-retweet" data-tweet-id="${tweet.id}" aria-label="Retweeter">
                        <span class="icone-action">🔄</span>
                        <span class="compteur-action compteur-retweet">${tweet.retweets || 0}</span>
                    </button>
                    <button class="bouton-action bouton-like" data-tweet-id="${tweet.id}" aria-label="J'aime">
                        <span class="icone-action">❤️</span>
                        <span class="compteur-action compteur-like">${tweet.likes || 0}</span>
                    </button>
                    <button class="bouton-action" aria-label="Partager">
                        <span class="icone-action">📤</span>
                    </button>
                </nav>
            </section>
        `;

        return tweetElement;
    },

    // Créer le HTML pour les médias
    createMediaHTML(media) {
        if (!media || media.length === 0) return '';

        return `
            <section class="medias-tweet">
                ${media.map(m => {
            if (m.type === 'image') {
                return `<img src="${m.url}" alt="Image du tweet" class="image-tweet" onerror="this.style.display='none'">`;
            } else if (m.type === 'video') {
                return `<video src="${m.url}" controls class="video-tweet"></video>`;
            }
            return '';
        }).join('')}
            </section>
        `;
    },

    // Échapper le HTML pour éviter les injections XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Afficher un message d'erreur
    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'message-erreur';
        errorElement.style.cssText = `
            background-color: #f4212e;
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 16px;
            font-size: 15px;
        `;
        errorElement.textContent = message;

        const timeline = document.querySelector('.timeline');
        if (timeline) {
            timeline.insertBefore(errorElement, timeline.firstChild);
            setTimeout(() => errorElement.remove(), 5000);
        }
    },

    // Afficher un message de succès
    showSuccess(message) {
        const successElement = document.createElement('div');
        successElement.className = 'message-succes';
        successElement.style.cssText = `
            background-color: #00ba7c;
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 16px;
            font-size: 15px;
        `;
        successElement.textContent = message;

        const timeline = document.querySelector('.timeline');
        if (timeline) {
            timeline.insertBefore(successElement, timeline.firstChild);
            setTimeout(() => successElement.remove(), 3000);
        }
    }
};

