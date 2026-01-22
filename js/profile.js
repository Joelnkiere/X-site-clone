// ============================================
// GESTION DU PROFIL UTILISATEUR - FONCTIONS SIMPLES
// ============================================

document.addEventListener('DOMContentLoaded', async function () {
    // Vérifier que l'utilisateur est connecté
    if (typeof isAuthenticated !== 'function' || !isAuthenticated()) {
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Charger et afficher le profil
    async function loadProfile() {
        try {
            // Récupérer les éléments du DOM
            const nomProfil = document.querySelector('.nom-profil');
            const nomUtilisateurProfil = document.querySelector('.nom-utilisateur-profil');
            const bioProfil = document.querySelector('.bio-profil');
            const avatarProfil = document.querySelector('.avatar-profil');
            const localisationProfil = document.getElementById('localisationProfil');
            const localisationTexte = document.getElementById('localisationTexte');
            const siteWebProfil = document.getElementById('siteWebProfil');
            const siteWebLien = document.getElementById('siteWebLien');
            const dateCreationTexte = document.getElementById('dateCreationTexte');
            const followingCount = document.getElementById('followingCount');
            const followersCount = document.getElementById('followersCount');
            const profilTweetsCount = document.getElementById('profilTweetsCount');

            // Mettre à jour le nom
            if (nomProfil) {
                nomProfil.textContent = currentUser.name;
            }

            // Mettre à jour le nom d'utilisateur
            if (nomUtilisateurProfil) {
                nomUtilisateurProfil.textContent = '@' + currentUser.username;
            }

            // Mettre à jour la bio
            if (bioProfil) {
                bioProfil.textContent = currentUser.bio || '';
            }

            // Mettre à jour l'avatar
            if (avatarProfil) {
                avatarProfil.src = currentUser.profilePicture || 'images/user-avatar.png';
            }

            // Mettre à jour la localisation
            if (localisationProfil && localisationTexte) {
                if (currentUser.location) {
                    localisationTexte.textContent = currentUser.location;
                    localisationProfil.style.display = 'flex';
                } else {
                    localisationProfil.style.display = 'none';
                }
            }

            // Mettre à jour le site web
            if (siteWebProfil && siteWebLien) {
                if (currentUser.website) {
                    siteWebLien.href = currentUser.website;
                    siteWebLien.textContent = currentUser.website.replace(/^https?:\/\//, '');
                    siteWebProfil.style.display = 'flex';
                } else {
                    siteWebProfil.style.display = 'none';
                }
            }

            // Mettre à jour la date de création
            if (dateCreationTexte && currentUser.createdAt) {
                const date = new Date(currentUser.createdAt);
                const mois = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                dateCreationTexte.textContent = 'A rejoint en ' + mois;
            }

            // Mettre à jour les statistiques
            if (followingCount) {
                followingCount.textContent = currentUser.following || 0;
            }
            if (followersCount) {
                followersCount.textContent = currentUser.followers || 0;
            }

            // Charger les tweets de l'utilisateur
            await loadUserTweets();

            // Mettre à jour le compteur de tweets
            if (profilTweetsCount) {
                const tweets = await getUserTweets(currentUser.id);
                profilTweetsCount.textContent = tweets.length + ' posts';
            }

        } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
        }
    }

    // Charger les tweets de l'utilisateur
    async function loadUserTweets() {
        const tweetsContainer = document.getElementById('tweetsProfil');
        if (!tweetsContainer) return;

        tweetsContainer.innerHTML = '<section class="chargement"><div class="spinner"></div><p>Chargement...</p></section>';

        try {
            const tweets = await getUserTweets(currentUser.id);

            tweetsContainer.innerHTML = '';

            if (tweets.length === 0) {
                tweetsContainer.innerHTML = '<p style="text-align: center; padding: 32px; color: #71767b;">Aucun tweet pour le moment.</p>';
                return;
            }

            // Afficher les tweets
            for (let i = 0; i < tweets.length; i++) {
                const tweet = tweets[i];
                const tweetElement = createTweetHTML(tweet, currentUser, currentUser.id);
                tweetsContainer.appendChild(tweetElement);
            }

            // Attacher les gestionnaires d'événements
            attachTweetEventHandlers();

        } catch (error) {
            console.error('Erreur lors du chargement des tweets:', error);
            tweetsContainer.innerHTML = '<p style="text-align: center; padding: 32px; color: #f4212e;">Erreur de chargement.</p>';
        }
    }

    // Attacher les gestionnaires d'événements pour les actions de tweets
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
                    await loadUserTweets();
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

                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(url);
                    showMessage('Lien copié !', 'succes');
                }
            });
        }
    }

    // Charger le profil au démarrage
    await loadProfile();
});
