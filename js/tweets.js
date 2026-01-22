// ============================================
// GESTION DES TWEETS - FONCTIONS SIMPLES
// ============================================

// La constante API_BASE_URL est définie dans auth.js
// const API_BASE_URL = 'http://localhost:3000';

// Variable pour stocker l'image sélectionnée
let selectedImage = null;

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

// Formater une date relative (ex: "2h")
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'maintenant';
    } else if (diffInSeconds < 3600) {
        return Math.floor(diffInSeconds / 60) + 'm';
    } else if (diffInSeconds < 86400) {
        return Math.floor(diffInSeconds / 3600) + 'h';
    } else if (diffInSeconds < 604800) {
        return Math.floor(diffInSeconds / 86400) + 'j';
    } else {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
}

// Formater une date complète
function formatFullDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Échapper le HTML pour éviter les injections
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Formater le contenu du tweet (hashtags, mentions)
function formatTweetContent(content) {
    let formatted = escapeHtml(content);
    // Hashtags en bleu
    formatted = formatted.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    // Mentions en bleu
    formatted = formatted.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    // Retours à la ligne
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}

// ============================================
// FONCTIONS API - UTILISATEURS
// ============================================

// Récupérer tous les utilisateurs
async function getUsers() {
    try {
        const response = await fetch(API_BASE_URL + '/users');
        const users = await response.json();
        return users;
    } catch (error) {
        console.error('Erreur:', error);
        return [];
    }
}

// Récupérer un utilisateur par ID
async function getUserById(userId) {
    try {
        const response = await fetch(API_BASE_URL + '/users/' + userId);
        const user = await response.json();
        return user;
    } catch (error) {
        console.error('Erreur:', error);
        return null;
    }
}

// ============================================
// FONCTIONS API - TWEETS
// ============================================

// Récupérer tous les tweets (les plus récents en premier)
async function getTweets() {
    try {
        const response = await fetch(API_BASE_URL + '/tweets?_sort=createdAt&_order=desc');
        const tweets = await response.json();
        return tweets;
    } catch (error) {
        console.error('Erreur:', error);
        return [];
    }
}

// Récupérer un tweet par ID
async function getTweetById(tweetId) {
    try {
        const response = await fetch(API_BASE_URL + '/tweets/' + tweetId);
        const tweet = await response.json();
        return tweet;
    } catch (error) {
        console.error('Erreur:', error);
        return null;
    }
}

// Récupérer les réponses d'un tweet
async function getReplies(tweetId) {
    try {
        const response = await fetch(API_BASE_URL + '/tweets?replyTo=' + tweetId + '&_sort=createdAt&_order=asc');
        const replies = await response.json();
        return replies;
    } catch (error) {
        console.error('Erreur:', error);
        return [];
    }
}

// Récupérer les tweets d'un utilisateur
async function getUserTweets(userId) {
    try {
        const response = await fetch(API_BASE_URL + '/tweets?userId=' + userId + '&_sort=createdAt&_order=desc');
        const tweets = await response.json();
        // Filtrer pour exclure les réponses
        return tweets.filter(function (t) { return !t.replyTo; });
    } catch (error) {
        console.error('Erreur:', error);
        return [];
    }
}

// Créer un nouveau tweet
async function createTweet(userId, content, mediaList, replyTo) {
    try {
        // Récupérer tous les tweets pour trouver le prochain ID
        const allTweets = await getTweets();
        let maxId = 0;
        for (let i = 0; i < allTweets.length; i++) {
            const id = parseInt(allTweets[i].id);
            if (id > maxId) {
                maxId = id;
            }
        }
        const nextId = (maxId + 1).toString();

        // Créer l'objet tweet
        const newTweet = {
            id: nextId,
            userId: userId.toString(),
            content: content,
            media: mediaList || [],
            likes: 0,
            retweets: 0,
            replies: [],
            createdAt: new Date().toISOString(),
            replyTo: replyTo ? replyTo.toString() : null
        };

        // Envoyer au serveur
        const response = await fetch(API_BASE_URL + '/tweets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTweet)
        });

        if (response.ok) {
            const createdTweet = await response.json();

            // Si c'est une réponse, mettre à jour le tweet parent
            if (replyTo) {
                const parentTweet = await getTweetById(replyTo);
                if (parentTweet) {
                    const updatedReplies = parentTweet.replies || [];
                    updatedReplies.push(createdTweet.id);
                    await updateTweet(replyTo, { replies: updatedReplies });
                }
            }

            return createdTweet;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Erreur:', error);
        return null;
    }
}

// Supprimer un tweet
async function deleteTweet(tweetId) {
    try {
        const response = await fetch(API_BASE_URL + '/tweets/' + tweetId, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        console.error('Erreur:', error);
        return false;
    }
}

// Mettre à jour un tweet
async function updateTweet(tweetId, updates) {
    try {
        const response = await fetch(API_BASE_URL + '/tweets/' + tweetId, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const updatedTweet = await response.json();
        return updatedTweet;
    } catch (error) {
        console.error('Erreur:', error);
        return null;
    }
}

// ============================================
// GESTION DES LIKES ET RETWEETS
// ============================================

// Vérifier si un tweet est liké par l'utilisateur
function isTweetLiked(tweetId) {
    const likedTweets = JSON.parse(localStorage.getItem('likedTweets') || '[]');
    return likedTweets.includes(tweetId.toString());
}

// Vérifier si un tweet est retweeté par l'utilisateur
function isTweetRetweeted(tweetId) {
    const retweetedTweets = JSON.parse(localStorage.getItem('retweetedTweets') || '[]');
    return retweetedTweets.includes(tweetId.toString());
}

// Vérifier si un tweet est dans les signets
function isTweetBookmarked(tweetId) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    return bookmarks.includes(tweetId.toString());
}

// Toggle like
async function toggleLike(tweetId, button) {
    const likedTweets = JSON.parse(localStorage.getItem('likedTweets') || '[]');
    const tweetIdStr = tweetId.toString();
    const compteur = button.querySelector('.compteur-like');
    const currentLikes = parseInt(compteur.textContent) || 0;

    // Animation
    button.classList.add('animating');
    setTimeout(function () { button.classList.remove('animating'); }, 300);

    const index = likedTweets.indexOf(tweetIdStr);

    if (index > -1) {
        // Unlike
        likedTweets.splice(index, 1);
        localStorage.setItem('likedTweets', JSON.stringify(likedTweets));
        button.classList.remove('actif');
        button.innerHTML = ICON_LIKE + '<span class="compteur-action compteur-like">' + Math.max(0, currentLikes - 1) + '</span>';
        await updateTweet(tweetId, { likes: Math.max(0, currentLikes - 1) });
    } else {
        // Like
        likedTweets.push(tweetIdStr);
        localStorage.setItem('likedTweets', JSON.stringify(likedTweets));
        button.classList.add('actif');
        button.innerHTML = ICON_LIKE_FILLED + '<span class="compteur-action compteur-like">' + (currentLikes + 1) + '</span>';
        await updateTweet(tweetId, { likes: currentLikes + 1 });
    }
}

// Toggle retweet
async function toggleRetweet(tweetId, button) {
    const retweetedTweets = JSON.parse(localStorage.getItem('retweetedTweets') || '[]');
    const tweetIdStr = tweetId.toString();
    const compteur = button.querySelector('.compteur-retweet');
    const currentRetweets = parseInt(compteur.textContent) || 0;

    const index = retweetedTweets.indexOf(tweetIdStr);

    if (index > -1) {
        // Un-retweet
        retweetedTweets.splice(index, 1);
        localStorage.setItem('retweetedTweets', JSON.stringify(retweetedTweets));
        button.classList.remove('actif');
        compteur.textContent = Math.max(0, currentRetweets - 1);
        await updateTweet(tweetId, { retweets: Math.max(0, currentRetweets - 1) });
    } else {
        // Retweet
        retweetedTweets.push(tweetIdStr);
        localStorage.setItem('retweetedTweets', JSON.stringify(retweetedTweets));
        button.classList.add('actif');
        compteur.textContent = currentRetweets + 1;
        await updateTweet(tweetId, { retweets: currentRetweets + 1 });
    }
}

// Toggle bookmark
function toggleBookmark(tweetId, button) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const tweetIdStr = tweetId.toString();

    const index = bookmarks.indexOf(tweetIdStr);

    if (index > -1) {
        // Retirer des signets
        bookmarks.splice(index, 1);
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        button.classList.remove('actif');
        button.innerHTML = ICON_BOOKMARK;
        showMessage('Retiré des signets', 'succes');
    } else {
        // Ajouter aux signets
        bookmarks.push(tweetIdStr);
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        button.classList.add('actif');
        button.innerHTML = ICON_BOOKMARK_FILLED;
        showMessage('Ajouté aux signets', 'succes');
    }
}

// ============================================
// AFFICHAGE DES MESSAGES
// ============================================

function showMessage(message, type) {
    const element = document.createElement('div');
    element.className = 'message-' + type;
    element.textContent = message;

    const timeline = document.querySelector('.timeline') || document.querySelector('.tweets-profil');
    if (timeline) {
        timeline.insertBefore(element, timeline.firstChild);
        setTimeout(function () { element.remove(); }, 3000);
    }
}

// ============================================
// ICÔNES SVG
// ============================================

const ICON_REPLY = '<svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></svg>';

const ICON_RETWEET = '<svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></svg>';

const ICON_LIKE = '<svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></svg>';

const ICON_LIKE_FILLED = '<svg viewBox="0 0 24 24"><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></svg>';

const ICON_SHARE = '<svg viewBox="0 0 24 24"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"></path></svg>';

const ICON_BOOKMARK = '<svg viewBox="0 0 24 24"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"></path></svg>';

const ICON_BOOKMARK_FILLED = '<svg viewBox="0 0 24 24"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"></path></svg>';

const ICON_DELETE = '<svg viewBox="0 0 24 24"><path d="M16 6V4.5C16 3.12 14.88 2 13.5 2h-3C9.11 2 8 3.12 8 4.5V6H3v2h1.06l.81 11.21C4.98 20.78 6.28 22 7.86 22h8.27c1.58 0 2.88-1.22 3-2.79L19.93 8H21V6h-5zm-6-1.5c0-.28.22-.5.5-.5h3c.27 0 .5.22.5.5V6h-4V4.5zm7.13 14.57c-.04.52-.47.93-1 .93H7.86c-.53 0-.96-.41-1-.93L6.07 8h11.85l-.79 11.07z"></path></svg>';

const ICON_IMAGE = '<svg viewBox="0 0 24 24"><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></svg>';

// ============================================
// CRÉATION DU HTML D'UN TWEET
// ============================================

function createTweetHTML(tweet, user, currentUserId) {
    const avatarUrl = user.profilePicture || 'images/user-avatar.png';
    const relativeTime = formatRelativeTime(tweet.createdAt);
    const isOwner = currentUserId && (tweet.userId == currentUserId);
    const isLiked = isTweetLiked(tweet.id);
    const isRetweeted = isTweetRetweeted(tweet.id);
    const isBookmarked = isTweetBookmarked(tweet.id);

    // Créer le HTML des médias
    let mediaHTML = '';
    if (tweet.media && tweet.media.length > 0) {
        mediaHTML = '<section class="medias-tweet">';
        for (let i = 0; i < tweet.media.length; i++) {
            const m = tweet.media[i];
            if (m.type === 'image') {
                mediaHTML += '<img src="' + m.url + '" alt="Image" class="image-tweet" onerror="this.style.display=\'none\'">';
            } else if (m.type === 'video') {
                mediaHTML += '<video src="' + m.url + '" controls class="video-tweet"></video>';
            }
        }
        mediaHTML += '</section>';
    }

    const tweetElement = document.createElement('article');
    tweetElement.className = 'carte-tweet';
    tweetElement.setAttribute('data-tweet-id', tweet.id);

    tweetElement.innerHTML =
        '<section class="avatar-tweet">' +
        '<img src="' + avatarUrl + '" alt="Avatar" class="avatar" onerror="this.src=\'images/user-avatar.png\'">' +
        '</section>' +
        '<section class="contenu-tweet">' +
        '<header class="en-tete-tweet">' +
        '<span class="nom-auteur">' + escapeHtml(user.name) + '</span>' +
        '<span class="nom-utilisateur">@' + escapeHtml(user.username) + '</span>' +
        '<span class="date-tweet">· ' + relativeTime + '</span>' +
        (isOwner ? '<button class="bouton-supprimer-tweet" data-tweet-id="' + tweet.id + '" title="Supprimer">' + ICON_DELETE + '</button>' : '') +
        '</header>' +
        '<p class="texte-tweet">' + formatTweetContent(tweet.content) + '</p>' +
        mediaHTML +
        '<nav class="actions-tweet">' +
        '<a href="tweet-detail.html?id=' + tweet.id + '" class="bouton-action bouton-repondre" aria-label="Répondre">' +
        ICON_REPLY +
        '<span class="compteur-action">' + (tweet.replies ? tweet.replies.length : 0) + '</span>' +
        '</a>' +
        '<button class="bouton-action bouton-retweet ' + (isRetweeted ? 'actif' : '') + '" data-tweet-id="' + tweet.id + '" aria-label="Retweeter">' +
        ICON_RETWEET +
        '<span class="compteur-action compteur-retweet">' + (tweet.retweets || 0) + '</span>' +
        '</button>' +
        '<button class="bouton-action bouton-like ' + (isLiked ? 'actif' : '') + '" data-tweet-id="' + tweet.id + '" aria-label="J\'aime">' +
        (isLiked ? ICON_LIKE_FILLED : ICON_LIKE) +
        '<span class="compteur-action compteur-like">' + (tweet.likes || 0) + '</span>' +
        '</button>' +
        '<button class="bouton-action bouton-bookmark ' + (isBookmarked ? 'actif' : '') + '" data-tweet-id="' + tweet.id + '" aria-label="Enregistrer">' +
        (isBookmarked ? ICON_BOOKMARK_FILLED : ICON_BOOKMARK) +
        '</button>' +
        '<button class="bouton-action bouton-partager" data-tweet-id="' + tweet.id + '" aria-label="Partager">' +
        ICON_SHARE +
        '</button>' +
        '</nav>' +
        '</section>';

    return tweetElement;
}

// ============================================
// GESTION DE L'UPLOAD D'IMAGE
// ============================================

function convertImageToBase64(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
            resolve(reader.result);
        };
        reader.onerror = function () {
            reject(reader.error);
        };
        reader.readAsDataURL(file);
    });
}

function showImagePreview(imageUrl) {
    // Supprimer l'aperçu existant s'il existe
    removeImagePreview();

    const previewContainer = document.createElement('section');
    previewContainer.id = 'imagePreview';
    previewContainer.className = 'apercu-image';
    previewContainer.innerHTML =
        '<img src="' + imageUrl + '" alt="Aperçu">' +
        '<button type="button" class="bouton-supprimer-image" title="Supprimer">×</button>';

    const champsTweet = document.querySelector('.champs-formulaire-tweet');
    const piedFormulaire = champsTweet.querySelector('.pied-formulaire-tweet');
    champsTweet.insertBefore(previewContainer, piedFormulaire);

    // Ajouter l'événement pour supprimer l'image
    previewContainer.querySelector('.bouton-supprimer-image').addEventListener('click', function () {
        removeImagePreview();
    });
}

function removeImagePreview() {
    selectedImage = null;
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.remove();
    }
}
