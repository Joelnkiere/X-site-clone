// ============================================
// GESTION DES TWEETS - INDEX.HTML
// ============================================

document.addEventListener('DOMContentLoaded', async function () {
    // Vérifier que l'utilisateur est connecté
    if (!AuthService || !AuthService.isAuthenticated()) {
        return;
    }

    const currentUser = AuthService.getCurrentUser();
    const timeline = document.querySelector('.timeline');
    const formulaireTweet = document.getElementById('formulaireTweet');
    const contenuTweet = document.getElementById('contenuTweet');
    const compteurCaracteres = document.getElementById('compteurCaracteres');
    const boutonTweeter = document.querySelector('.bouton-tweeter');

    // Compteur de caractères
    if (contenuTweet && compteurCaracteres) {
        contenuTweet.addEventListener('input', function () {
            const longueur = contenuTweet.value.length;
            compteurCaracteres.textContent = longueur;

            // Changer la couleur si on approche de la limite
            if (longueur > 260) {
                compteurCaracteres.parentElement.style.color = '#f4212e';
            } else if (longueur > 240) {
                compteurCaracteres.parentElement.style.color = '#ffd400';
            } else {
                compteurCaracteres.parentElement.style.color = '#71767b';
            }

            // Désactiver le bouton si le tweet est vide ou trop long
            if (boutonTweeter) {
                if (longueur === 0 || longueur > 280) {
                    boutonTweeter.disabled = true;
                } else {
                    boutonTweeter.disabled = false;
                }
            }
        });
    }

    // Mettre à jour l'avatar du formulaire
    const avatarFormulaire = document.querySelector('.avatar-formulaire-tweet img');
    if (avatarFormulaire && currentUser) {
        avatarFormulaire.src = currentUser.profilePicture || 'images/user-avatar.png';
        avatarFormulaire.alt = `Avatar de ${currentUser.name}`;
    }

    // Charger et afficher les tweets
    async function loadTweets() {
        if (!timeline) return;

        timeline.innerHTML = '<p style="text-align: center; padding: 20px; color: #71767b;">Chargement des tweets...</p>';

        try {
            const tweets = await TweetService.getTweets();
            const users = await TweetService.getUsers();
            const usersMap = {};
            users.forEach(u => usersMap[u.id] = u);

            timeline.innerHTML = '';

            if (tweets.length === 0) {
                timeline.innerHTML = '<p style="text-align: center; padding: 20px; color: #71767b;">Aucun tweet pour le moment. Soyez le premier à tweeter !</p>';
                return;
            }

            // Filtrer les tweets principaux (pas les réponses)
            const mainTweets = tweets.filter(t => !t.replyTo);

            if (mainTweets.length === 0) {
                timeline.innerHTML = '<p style="text-align: center; padding: 20px; color: #71767b;">Aucun tweet pour le moment.</p>';
                return;
            }

            mainTweets.forEach(tweet => {
                const user = usersMap[tweet.userId];
                if (user) {
                    const tweetElement = TweetService.createTweetElement(tweet, user, currentUser.id);
                    timeline.appendChild(tweetElement);
                }
            });

            // Ajouter les gestionnaires d'événements pour les actions
            attachTweetEventHandlers();
        } catch (error) {
            console.error('Erreur lors du chargement des tweets:', error);
            timeline.innerHTML = '<p style="text-align: center; padding: 20px; color: #f4212e;">Erreur lors du chargement des tweets. Vérifiez que le serveur est démarré.</p>';
        }
    }

    // Créer un nouveau tweet
    if (formulaireTweet) {
        formulaireTweet.addEventListener('submit', async function (e) {
            e.preventDefault();

            const content = contenuTweet.value.trim();

            if (!content || content.length === 0 || content.length > 280) {
                TweetService.showError('Le tweet doit contenir entre 1 et 280 caractères.');
                return;
            }

            if (!currentUser) {
                TweetService.showError('Vous devez être connecté pour tweeter.');
                return;
            }

            try {
                boutonTweeter.disabled = true;
                boutonTweeter.textContent = 'Publication...';

                await TweetService.createTweet({
                    userId: currentUser.id,
                    content: content,
                    media: []
                });

                contenuTweet.value = '';
                compteurCaracteres.textContent = '0';
                compteurCaracteres.parentElement.style.color = '#71767b';
                boutonTweeter.disabled = true;

                TweetService.showSuccess('Tweet publié avec succès !');

                // Recharger les tweets
                await loadTweets();
            } catch (error) {
                console.error('Erreur lors de la création du tweet:', error);
                TweetService.showError('Erreur lors de la publication du tweet.');
            } finally {
                boutonTweeter.disabled = false;
                boutonTweeter.textContent = 'Tweeter';
            }
        });
    }

    // Attacher les gestionnaires d'événements pour les actions de tweets
    function attachTweetEventHandlers() {
        // Likes
        document.querySelectorAll('.bouton-like').forEach(btn => {
            btn.addEventListener('click', async function () {
                const tweetId = parseInt(this.dataset.tweetId);
                const compteur = this.querySelector('.compteur-like');
                const currentLikes = parseInt(compteur.textContent) || 0;

                try {
                    await TweetService.updateTweet(tweetId, {
                        likes: currentLikes + 1
                    });
                    compteur.textContent = currentLikes + 1;
                } catch (error) {
                    console.error('Erreur lors du like:', error);
                }
            });
        });

        // Retweets
        document.querySelectorAll('.bouton-retweet').forEach(btn => {
            btn.addEventListener('click', async function () {
                const tweetId = parseInt(this.dataset.tweetId);
                const compteur = this.querySelector('.compteur-retweet');
                const currentRetweets = parseInt(compteur.textContent) || 0;

                try {
                    await TweetService.updateTweet(tweetId, {
                        retweets: currentRetweets + 1
                    });
                    compteur.textContent = currentRetweets + 1;
                } catch (error) {
                    console.error('Erreur lors du retweet:', error);
                }
            });
        });

        // Suppression de tweets
        document.querySelectorAll('.bouton-supprimer-tweet').forEach(btn => {
            btn.addEventListener('click', async function () {
                if (!confirm('Êtes-vous sûr de vouloir supprimer ce tweet ?')) {
                    return;
                }

                const tweetId = parseInt(this.dataset.tweetId);

                try {
                    const success = await TweetService.deleteTweet(tweetId);
                    if (success) {
                        TweetService.showSuccess('Tweet supprimé avec succès !');
                        await loadTweets();
                    } else {
                        TweetService.showError('Erreur lors de la suppression du tweet.');
                    }
                } catch (error) {
                    console.error('Erreur lors de la suppression:', error);
                    TweetService.showError('Erreur lors de la suppression du tweet.');
                }
            });
        });
    }

    // Charger les tweets au démarrage
    await loadTweets();
});

// ============================================
// GESTION DES RÉPONSES - TWEET-DETAIL.HTML
// ============================================

document.addEventListener('DOMContentLoaded', async function () {
    // Vérifier que l'utilisateur est connecté
    if (!AuthService || !AuthService.isAuthenticated()) {
        return;
    }

    const currentUser = AuthService.getCurrentUser();
    const formulaireReponse = document.getElementById('formulaireReponse');
    const contenuReponse = document.getElementById('contenuReponse');
    const compteurReponse = document.querySelector('#formulaireReponse .compteur-caracteres span');

    // Récupérer l'ID du tweet depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const tweetId = parseInt(urlParams.get('id'));

    if (!tweetId) {
        window.location.href = 'index.html';
        return;
    }

    // Compteur de caractères pour les réponses
    if (contenuReponse && compteurReponse) {
        contenuReponse.addEventListener('input', function () {
            const longueur = contenuReponse.value.length;
            compteurReponse.textContent = longueur;

            // Changer la couleur si on approche de la limite
            const compteurParent = compteurReponse.parentElement;
            if (longueur > 260) {
                compteurParent.style.color = '#f4212e';
            } else if (longueur > 240) {
                compteurParent.style.color = '#ffd400';
            } else {
                compteurParent.style.color = '#71767b';
            }

            // Désactiver le bouton si la réponse est vide ou trop longue
            const boutonReponse = document.querySelector('#formulaireReponse .bouton-tweeter');
            if (boutonReponse) {
                if (longueur === 0 || longueur > 280) {
                    boutonReponse.disabled = true;
                } else {
                    boutonReponse.disabled = false;
                }
            }
        });
    }

    // Charger et afficher le tweet principal
    async function loadTweetDetail() {
        try {
            const tweet = await TweetService.getTweetById(tweetId);
            if (!tweet) {
                window.location.href = 'index.html';
                return;
            }

            const user = await TweetService.getUserById(tweet.userId);
            if (!user) {
                window.location.href = 'index.html';
                return;
            }

            // Afficher le tweet principal
            const carteTweetPrincipal = document.querySelector('.carte-tweet-principal');
            if (carteTweetPrincipal) {
                const avatarUrl = user.profilePicture || 'images/user-avatar.png';
                const fullDate = TweetService.formatFullDate(tweet.createdAt);
                const relativeTime = TweetService.formatRelativeTime(tweet.createdAt);
                const isOwner = currentUser && tweet.userId === currentUser.id;

                carteTweetPrincipal.innerHTML = `
                    <section class="avatar-tweet">
                        <img src="${avatarUrl}" alt="Avatar de ${user.name}" class="avatar" onerror="this.src='images/user-avatar.png'">
                    </section>
                    <section class="contenu-tweet">
                        <header class="en-tete-tweet">
                            <span class="nom-auteur">${TweetService.escapeHtml(user.name)}</span>
                            <span class="nom-utilisateur">@${TweetService.escapeHtml(user.username)}</span>
                            <span class="date-tweet">· ${relativeTime}</span>
                            ${isOwner ? `<button class="bouton-supprimer-tweet" data-tweet-id="${tweet.id}" title="Supprimer">🗑️</button>` : ''}
                        </header>
                        <p class="texte-tweet">${TweetService.escapeHtml(tweet.content)}</p>
                        ${tweet.media && tweet.media.length > 0 ? TweetService.createMediaHTML(tweet.media) : ''}
                        <footer class="pied-tweet">
                            <time class="date-complete" datetime="${tweet.createdAt}">${fullDate}</time>
                        </footer>
                        <nav class="actions-tweet">
                            <button class="bouton-action" aria-label="Répondre">
                                <span class="icone-action">💬</span>
                                <span class="compteur-action">${tweet.replies ? tweet.replies.length : 0}</span>
                            </button>
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

                // Gestionnaires d'événements pour le tweet principal
                attachDetailEventHandlers(carteTweetPrincipal);
            }

            // Charger les réponses
            await loadReplies();
        } catch (error) {
            console.error('Erreur lors du chargement du tweet:', error);
        }
    }

    // Charger les réponses
    async function loadReplies() {
        const sectionReponses = document.querySelector('.section-reponses');
        if (!sectionReponses) return;

        try {
            const replies = await TweetService.getReplies(tweetId);
            const users = await TweetService.getUsers();
            const usersMap = {};
            users.forEach(u => usersMap[u.id] = u);

            // Supprimer les tweets existants (garder le header)
            const enTeteReponses = sectionReponses.querySelector('.en-tete-reponses');
            const existingTweets = sectionReponses.querySelectorAll('.carte-tweet');
            existingTweets.forEach(t => t.remove());

            if (replies.length === 0) {
                const noRepliesMsg = document.createElement('p');
                noRepliesMsg.style.cssText = 'text-align: center; padding: 20px; color: #71767b;';
                noRepliesMsg.textContent = 'Aucune réponse pour le moment.';
                sectionReponses.appendChild(noRepliesMsg);
                return;
            }

            replies.forEach(reply => {
                const user = usersMap[reply.userId];
                if (user) {
                    const replyElement = TweetService.createTweetElement(reply, user, currentUser.id);
                    sectionReponses.appendChild(replyElement);
                }
            });

            // Attacher les gestionnaires d'événements pour les réponses
            attachTweetEventHandlers();
        } catch (error) {
            console.error('Erreur lors du chargement des réponses:', error);
        }
    }

    // Gestionnaires d'événements pour les actions
    function attachDetailEventHandlers(container) {
        // Like
        const likeBtn = container.querySelector('.bouton-like');
        if (likeBtn) {
            likeBtn.addEventListener('click', async function () {
                const tweetId = parseInt(this.dataset.tweetId);
                const compteur = this.querySelector('.compteur-like');
                const currentLikes = parseInt(compteur.textContent) || 0;

                try {
                    await TweetService.updateTweet(tweetId, {
                        likes: currentLikes + 1
                    });
                    compteur.textContent = currentLikes + 1;
                } catch (error) {
                    console.error('Erreur lors du like:', error);
                }
            });
        }

        // Retweet
        const retweetBtn = container.querySelector('.bouton-retweet');
        if (retweetBtn) {
            retweetBtn.addEventListener('click', async function () {
                const tweetId = parseInt(this.dataset.tweetId);
                const compteur = this.querySelector('.compteur-retweet');
                const currentRetweets = parseInt(compteur.textContent) || 0;

                try {
                    await TweetService.updateTweet(tweetId, {
                        retweets: currentRetweets + 1
                    });
                    compteur.textContent = currentRetweets + 1;
                } catch (error) {
                    console.error('Erreur lors du retweet:', error);
                }
            });
        }

        // Suppression
        const deleteBtn = container.querySelector('.bouton-supprimer-tweet');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async function () {
                if (!confirm('Êtes-vous sûr de vouloir supprimer ce tweet ?')) {
                    return;
                }

                const tweetId = parseInt(this.dataset.tweetId);

                try {
                    const success = await TweetService.deleteTweet(tweetId);
                    if (success) {
                        window.location.href = 'index.html';
                    } else {
                        alert('Erreur lors de la suppression du tweet.');
                    }
                } catch (error) {
                    console.error('Erreur lors de la suppression:', error);
                    alert('Erreur lors de la suppression du tweet.');
                }
            });
        }
    }

    function attachTweetEventHandlers() {
        // Likes
        document.querySelectorAll('.bouton-like').forEach(btn => {
            btn.addEventListener('click', async function () {
                const tweetId = parseInt(this.dataset.tweetId);
                const compteur = this.querySelector('.compteur-like');
                const currentLikes = parseInt(compteur.textContent) || 0;

                try {
                    await TweetService.updateTweet(tweetId, {
                        likes: currentLikes + 1
                    });
                    compteur.textContent = currentLikes + 1;
                } catch (error) {
                    console.error('Erreur lors du like:', error);
                }
            });
        });

        // Retweets
        document.querySelectorAll('.bouton-retweet').forEach(btn => {
            btn.addEventListener('click', async function () {
                const tweetId = parseInt(this.dataset.tweetId);
                const compteur = this.querySelector('.compteur-retweet');
                const currentRetweets = parseInt(compteur.textContent) || 0;

                try {
                    await TweetService.updateTweet(tweetId, {
                        retweets: currentRetweets + 1
                    });
                    compteur.textContent = currentRetweets + 1;
                } catch (error) {
                    console.error('Erreur lors du retweet:', error);
                }
            });
        });

        // Suppression
        document.querySelectorAll('.bouton-supprimer-tweet').forEach(btn => {
            btn.addEventListener('click', async function () {
                if (!confirm('Êtes-vous sûr de vouloir supprimer ce tweet ?')) {
                    return;
                }

                const tweetId = parseInt(this.dataset.tweetId);

                try {
                    const success = await TweetService.deleteTweet(tweetId);
                    if (success) {
                        await loadReplies();
                    } else {
                        alert('Erreur lors de la suppression du tweet.');
                    }
                } catch (error) {
                    console.error('Erreur lors de la suppression:', error);
                    alert('Erreur lors de la suppression du tweet.');
                }
            });
        });
    }

    // Créer une réponse
    if (formulaireReponse) {
        formulaireReponse.addEventListener('submit', async function (e) {
            e.preventDefault();

            const content = contenuReponse.value.trim();

            if (!content || content.length === 0 || content.length > 280) {
                alert('La réponse doit contenir entre 1 et 280 caractères.');
                return;
            }

            if (!currentUser) {
                alert('Vous devez être connecté pour répondre.');
                return;
            }

            try {
                const boutonReponse = document.querySelector('#formulaireReponse .bouton-tweeter');
                boutonReponse.disabled = true;
                boutonReponse.textContent = 'Publication...';

                await TweetService.createTweet({
                    userId: currentUser.id,
                    content: content,
                    media: [],
                    replyTo: tweetId
                });

                contenuReponse.value = '';
                compteurReponse.textContent = '0';
                compteurReponse.parentElement.style.color = '#71767b';
                boutonReponse.disabled = true;

                TweetService.showSuccess('Réponse publiée avec succès !');

                // Recharger les réponses et mettre à jour le tweet principal
                await loadTweetDetail();
            } catch (error) {
                console.error('Erreur lors de la création de la réponse:', error);
                alert('Erreur lors de la publication de la réponse.');
            } finally {
                const boutonReponse = document.querySelector('#formulaireReponse .bouton-tweeter');
                boutonReponse.disabled = false;
                boutonReponse.textContent = 'Répondre';
            }
        });
    }

    // Mettre à jour l'avatar du formulaire de réponse
    const avatarReponse = document.querySelector('#formulaireReponse .avatar-formulaire-tweet img');
    if (avatarReponse && currentUser) {
        avatarReponse.src = currentUser.profilePicture || 'images/user-avatar.png';
        avatarReponse.alt = `Avatar de ${currentUser.name}`;
    }

    // Charger le tweet au démarrage
    await loadTweetDetail();
});

