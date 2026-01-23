// ============================================
// SCRIPT PRINCIPAL - INDEX.HTML
// ============================================

document.addEventListener('DOMContentLoaded', async function () {
    // Récupérer l'utilisateur connecté (peut être null)
    let currentUser = null;
    if (typeof getCurrentUser === 'function') {
        currentUser = getCurrentUser();
    }

    const timeline = document.querySelector('.timeline');
    const formulaireTweet = document.getElementById('formulaireTweet');
    const contenuTweet = document.getElementById('contenuTweet');
    const compteurCaracteres = document.getElementById('compteurCaracteres');
    const boutonTweeter = document.querySelector('.bouton-tweeter');
    const boutonImage = document.getElementById('boutonImage');
    const inputImage = document.getElementById('inputImage');

    // Compteur de caractères
    if (contenuTweet && compteurCaracteres) {
        contenuTweet.addEventListener('input', function () {
            const longueur = contenuTweet.value.length;
            compteurCaracteres.textContent = longueur;

            // Changer la couleur selon la longueur
            const parent = compteurCaracteres.parentElement;
            if (longueur > 260) {
                parent.style.color = '#f4212e';
            } else if (longueur > 240) {
                parent.style.color = '#ffd400';
            } else {
                parent.style.color = '#71767b';
            }

            // Activer/désactiver le bouton
            if (boutonTweeter) {
                boutonTweeter.disabled = longueur === 0 && !window.selectedImage;
            }
        });
    }

    // Gestion de l'upload d'image
    if (boutonImage && inputImage) {
        boutonImage.addEventListener('click', function () {
            inputImage.click();
        });

        inputImage.addEventListener('change', async function () {
            const file = this.files[0];
            if (file) {
                // Vérifier le type de fichier
                if (!file.type.startsWith('image/')) {
                    showMessage('Veuillez sélectionner une image', 'erreur');
                    return;
                }

                // Vérifier la taille (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showMessage('L\'image ne doit pas dépasser 5MB', 'erreur');
                    return;
                }

                try {
                    const base64 = await convertImageToBase64(file);
                    window.selectedImage = base64;
                    showImagePreview(base64);

                    // Activer le bouton si une image est sélectionnée
                    if (boutonTweeter) {
                        boutonTweeter.disabled = false;
                    }
                } catch (error) {
                    console.error('Erreur:', error);
                    showMessage('Erreur lors du chargement de l\'image', 'erreur');
                }
            }
        });
    }

    // Charger et afficher les tweets
    async function loadTweets() {
        if (!timeline) return;

        timeline.innerHTML = '<section class="chargement"><div class="spinner"></div><p>Chargement...</p></section>';

        try {
            // Récupérer les tweets et les utilisateurs
            const tweets = await getTweets();
            const users = await getUsers();

            // Créer un dictionnaire des utilisateurs
            const usersMap = {};
            for (let i = 0; i < users.length; i++) {
                usersMap[users[i].id] = users[i];
            }

            timeline.innerHTML = '';

            // Filtrer les tweets principaux (pas les réponses)
            const mainTweets = [];
            for (let i = 0; i < tweets.length; i++) {
                if (!tweets[i].replyTo) {
                    mainTweets.push(tweets[i]);
                }
            }

            if (mainTweets.length === 0) {
                timeline.innerHTML = '<p style="text-align: center; padding: 32px; color: #71767b;">Aucun tweet pour le moment. Soyez le premier à tweeter !</p>';
                return;
            }

            // Trier les tweets par date décroissante (les plus récents en premier)
            mainTweets.sort(function (a, b) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            // Afficher les tweets (les plus récents en premier)
            for (let i = 0; i < mainTweets.length; i++) {
                const tweet = mainTweets[i];
                const user = usersMap[tweet.userId];
                if (user) {
                    const tweetElement = createTweetHTML(tweet, user, currentUser ? currentUser.id : null);
                    timeline.appendChild(tweetElement);
                }
            }

            // Attacher les gestionnaires d'événements
            attachTweetEventHandlers();

        } catch (error) {
            console.error('Erreur:', error);
            timeline.innerHTML = '<p style="text-align: center; padding: 32px; color: #f4212e;">Erreur de chargement. Vérifiez que le serveur est démarré (npm run server).</p>';
        }
    }

    // Créer un nouveau tweet
    if (formulaireTweet) {
        formulaireTweet.addEventListener('submit', async function (e) {
            e.preventDefault();

            const content = contenuTweet.value.trim();

            // Vérifier qu'il y a du contenu ou une image
            if (!content && !window.selectedImage) {
                showMessage('Ajoutez du texte ou une image', 'erreur');
                return;
            }

            if (content.length > 280) {
                showMessage('Le tweet ne peut pas dépasser 280 caractères', 'erreur');
                return;
            }

            try {
                boutonTweeter.disabled = true;
                boutonTweeter.textContent = 'Publication...';

                // Préparer les médias
                const mediaList = [];
                if (window.selectedImage) {
                    console.log('Image trouvée, ajout aux médias:', window.selectedImage.substring(0, 50) + '...');
                    mediaList.push({
                        type: 'image',
                        url: window.selectedImage
                    });
                } else {
                    console.log('Aucune image sélectionnée');
                }
                console.log('mediaList:', mediaList);

                // Créer le tweet (utiliser l'ID de l'utilisateur connecté ou "1" par défaut)
                const userId = currentUser ? currentUser.id : '1';
                const newTweet = await createTweet(userId, content, mediaList, null);

                if (newTweet) {
                    // Réinitialiser le formulaire
                    contenuTweet.value = '';
                    compteurCaracteres.textContent = '0';
                    compteurCaracteres.parentElement.style.color = '#71767b';
                    removeImagePreview();
                    boutonTweeter.disabled = true;

                    showMessage('Tweet publié !', 'succes');

                    // Recharger les tweets pour afficher le nouveau en haut
                    await loadTweets();
                } else {
                    showMessage('Erreur lors de la publication', 'erreur');
                }

            } catch (error) {
                console.error('Erreur:', error);
                showMessage('Erreur lors de la publication', 'erreur');
            } finally {
                boutonTweeter.textContent = 'Poster';
            }
        });
    }

    // Attacher les gestionnaires d'événements aux tweets
    function attachTweetEventHandlers() {
        // Boutons Like
        const boutonLikes = document.querySelectorAll('.bouton-like');
        for (let i = 0; i < boutonLikes.length; i++) {
            boutonLikes[i].addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();
                const tweetId = this.getAttribute('data-tweet-id');
                await toggleLike(tweetId, this);
            });
        }

        // Boutons Retweet
        const boutonRetweets = document.querySelectorAll('.bouton-retweet');
        for (let i = 0; i < boutonRetweets.length; i++) {
            boutonRetweets[i].addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();
                const tweetId = this.getAttribute('data-tweet-id');
                await toggleRetweet(tweetId, this);
            });
        }

        // Boutons Bookmark
        const boutonBookmarks = document.querySelectorAll('.bouton-bookmark');
        for (let i = 0; i < boutonBookmarks.length; i++) {
            boutonBookmarks[i].addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const tweetId = this.getAttribute('data-tweet-id');
                toggleBookmark(tweetId, this);
            });
        }

        // Boutons Supprimer
        const boutonSupprimer = document.querySelectorAll('.bouton-supprimer-tweet');
        for (let i = 0; i < boutonSupprimer.length; i++) {
            boutonSupprimer[i].addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();

                if (!confirm('Supprimer ce tweet ?')) return;

                const tweetId = this.getAttribute('data-tweet-id');
                const success = await deleteTweet(tweetId);

                if (success) {
                    showMessage('Tweet supprimé !', 'succes');
                    await loadTweets();
                } else {
                    showMessage('Erreur lors de la suppression', 'erreur');
                }
            });
        }

        // Boutons Partager
        const boutonPartager = document.querySelectorAll('.bouton-partager');
        for (let i = 0; i < boutonPartager.length; i++) {
            boutonPartager[i].addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();

                const tweetId = this.getAttribute('data-tweet-id');
                const url = window.location.origin + '/tweet-detail.html?id=' + tweetId;

                if (navigator.share) {
                    try {
                        await navigator.share({ url: url });
                    } catch (err) {
                        // Partage annulé
                    }
                } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(url);
                    showMessage('Lien copié !', 'succes');
                }
            });
        }
    }

    // Recherche en temps réel
    const inputRecherche = document.getElementById('inputRecherche');
    if (inputRecherche) {
        let timeout;
        inputRecherche.addEventListener('input', function () {
            clearTimeout(timeout);
            const query = this.value.toLowerCase().trim();

            timeout = setTimeout(function () {
                const tweets = document.querySelectorAll('.carte-tweet');
                for (let i = 0; i < tweets.length; i++) {
                    const tweet = tweets[i];
                    const texte = tweet.querySelector('.texte-tweet');
                    const auteur = tweet.querySelector('.nom-auteur');

                    const texteContenu = texte ? texte.textContent.toLowerCase() : '';
                    const auteurContenu = auteur ? auteur.textContent.toLowerCase() : '';

                    if (query === '' || texteContenu.indexOf(query) !== -1 || auteurContenu.indexOf(query) !== -1) {
                        tweet.style.display = 'flex';
                    } else {
                        tweet.style.display = 'none';
                    }
                }
            }, 300);
        });
    }

    // Charger les tweets au démarrage
    await loadTweets();
});

// ============================================
// SCRIPT POUR TWEET-DETAIL.HTML
// ============================================

document.addEventListener('DOMContentLoaded', async function () {
    // Vérifier la page
    const formulaireReponse = document.getElementById('formulaireReponse');
    const contenuReponse = document.getElementById('contenuReponse');

    if (!formulaireReponse) return; // Pas sur la page tweet-detail

    // Récupérer l'ID du tweet depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const tweetId = urlParams.get('id');

    if (!tweetId) return;

    let currentUser = null;
    if (typeof getCurrentUser === 'function') {
        currentUser = getCurrentUser();
    }

    const compteurReponse = document.getElementById('compteurCaracteres');
    const boutonRepondre = formulaireReponse.querySelector('.bouton-tweeter');

    // Compteur de caractères pour les réponses
    if (contenuReponse && compteurReponse) {
        contenuReponse.addEventListener('input', function () {
            const longueur = contenuReponse.value.length;
            compteurReponse.textContent = longueur;

            if (longueur > 260) {
                compteurReponse.parentElement.style.color = '#f4212e';
            } else if (longueur > 240) {
                compteurReponse.parentElement.style.color = '#ffd400';
            } else {
                compteurReponse.parentElement.style.color = '#71767b';
            }

            if (boutonRepondre) {
                boutonRepondre.disabled = longueur === 0 || longueur > 280;
            }
        });
    }

    // Charger le tweet principal
    async function loadTweetDetail() {
        const cartePrincipal = document.querySelector('.carte-tweet-principal');
        if (!cartePrincipal) return;

        try {
            const tweet = await getTweetById(tweetId);
            if (!tweet) {
                cartePrincipal.innerHTML = '<p style="padding: 32px; color: #f4212e;">Tweet introuvable</p>';
                return;
            }

            const user = await getUserById(tweet.userId);
            if (!user) return;

            const avatarUrl = user.profilePicture || 'images/user-avatar.png';
            const fullDate = formatFullDate(tweet.createdAt);
            const isOwner = currentUser && (tweet.userId == currentUser.id);
            const isLiked = isTweetLiked(tweet.id);
            const isRetweeted = isTweetRetweeted(tweet.id);

            // Créer le HTML des médias
            let mediaHTML = '';
            if (tweet.media && tweet.media.length > 0) {
                mediaHTML = '<section class="medias-tweet">';
                for (let i = 0; i < tweet.media.length; i++) {
                    const m = tweet.media[i];
                    if (m.type === 'image') {
                        mediaHTML = mediaHTML + '<img src="' + m.url + '" alt="Image" class="image-tweet">';
                    }
                }
                mediaHTML = mediaHTML + '</section>';
            }

            cartePrincipal.innerHTML =
                '<section class="avatar-tweet">' +
                '<img src="' + avatarUrl + '" alt="Avatar" class="avatar">' +
                '</section>' +
                '<section class="contenu-tweet">' +
                '<header class="en-tete-tweet">' +
                '<span class="nom-auteur">' + escapeHtml(user.name) + '</span>' +
                '<span class="nom-utilisateur">@' + escapeHtml(user.username) + '</span>' +
                (isOwner ? '<button class="bouton-supprimer-tweet" data-tweet-id="' + tweet.id + '">' + ICON_DELETE + '</button>' : '') +
                '</header>' +
                '<p class="texte-tweet">' + formatTweetContent(tweet.content) + '</p>' +
                mediaHTML +
                '<footer class="pied-tweet"><time>' + fullDate + '</time></footer>' +
                '<nav class="actions-tweet">' +
                '<button class="bouton-action bouton-repondre">' + ICON_REPLY + '<span class="compteur-action">' + (tweet.replies ? tweet.replies.length : 0) + '</span></button>' +
                '<button class="bouton-action bouton-retweet ' + (isRetweeted ? 'actif' : '') + '" data-tweet-id="' + tweet.id + '">' + ICON_RETWEET + '<span class="compteur-action compteur-retweet">' + (tweet.retweets || 0) + '</span></button>' +
                '<button class="bouton-action bouton-like ' + (isLiked ? 'actif' : '') + '" data-tweet-id="' + tweet.id + '">' + (isLiked ? ICON_LIKE_FILLED : ICON_LIKE) + '<span class="compteur-action compteur-like">' + (tweet.likes || 0) + '</span></button>' +
                '<button class="bouton-action bouton-partager" data-tweet-id="' + tweet.id + '">' + ICON_SHARE + '</button>' +
                '</nav>' +
                '</section>';

            // Attacher les événements
            const likeBtn = cartePrincipal.querySelector('.bouton-like');
            if (likeBtn) {
                likeBtn.addEventListener('click', async function () {
                    await toggleLike(tweet.id, this);
                });
            }

            const retweetBtn = cartePrincipal.querySelector('.bouton-retweet');
            if (retweetBtn) {
                retweetBtn.addEventListener('click', async function () {
                    await toggleRetweet(tweet.id, this);
                });
            }

            const deleteBtn = cartePrincipal.querySelector('.bouton-supprimer-tweet');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async function () {
                    if (confirm('Supprimer ce tweet ?')) {
                        const success = await deleteTweet(tweet.id);
                        if (success) {
                            window.location.href = 'index.html';
                        }
                    }
                });
            }

            // Charger les réponses
            await loadReplies();

        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    // Charger les réponses
    async function loadReplies() {
        const sectionReponses = document.querySelector('.section-reponses');
        if (!sectionReponses) return;

        try {
            const replies = await getReplies(tweetId);
            const users = await getUsers();

            const usersMap = {};
            for (let i = 0; i < users.length; i++) {
                usersMap[users[i].id] = users[i];
            }

            // Supprimer les anciennes réponses
            const anciensElements = sectionReponses.querySelectorAll('.carte-tweet');
            for (let i = 0; i < anciensElements.length; i++) {
                anciensElements[i].remove();
            }

            if (replies.length === 0) {
                const msg = document.createElement('p');
                msg.style.cssText = 'text-align: center; padding: 32px; color: #71767b;';
                msg.textContent = 'Aucune réponse pour le moment.';
                sectionReponses.appendChild(msg);
                return;
            }

            for (let i = 0; i < replies.length; i++) {
                const reply = replies[i];
                const user = usersMap[reply.userId];
                if (user) {
                    const replyElement = createTweetHTML(reply, user, currentUser ? currentUser.id : null);
                    sectionReponses.appendChild(replyElement);
                }
            }

            // Attacher les événements aux réponses
            attachReplyEventHandlers(sectionReponses);

        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    function attachReplyEventHandlers(container) {
        const likes = container.querySelectorAll('.bouton-like');
        for (let i = 0; i < likes.length; i++) {
            likes[i].addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();
                const id = this.getAttribute('data-tweet-id');
                await toggleLike(id, this);
            });
        }

        const retweets = container.querySelectorAll('.bouton-retweet');
        for (let i = 0; i < retweets.length; i++) {
            retweets[i].addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();
                const id = this.getAttribute('data-tweet-id');
                await toggleRetweet(id, this);
            });
        }
    }

    // Soumettre une réponse
    if (formulaireReponse) {
        formulaireReponse.addEventListener('submit', async function (e) {
            e.preventDefault();

            const content = contenuReponse.value.trim();
            if (!content || content.length > 280) {
                showMessage('La réponse doit contenir entre 1 et 280 caractères', 'erreur');
                return;
            }

            try {
                boutonRepondre.disabled = true;
                boutonRepondre.textContent = 'Publication...';

                const userId = currentUser ? currentUser.id : '1';
                const reply = await createTweet(userId, content, [], tweetId);

                if (reply) {
                    contenuReponse.value = '';
                    compteurReponse.textContent = '0';
                    boutonRepondre.disabled = true;
                    showMessage('Réponse publiée !', 'succes');
                    await loadTweetDetail();
                } else {
                    showMessage('Erreur lors de la publication', 'erreur');
                }

            } catch (error) {
                console.error('Erreur:', error);
                showMessage('Erreur lors de la publication', 'erreur');
            } finally {
                boutonRepondre.textContent = 'Répondre';
            }
        });
    }

    // Charger le tweet au démarrage
    await loadTweetDetail();
});
