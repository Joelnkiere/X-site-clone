// ============================================
// GESTION DU PROFIL UTILISATEUR
// ============================================

document.addEventListener('DOMContentLoaded', async function () {
    // Vérifier que l'utilisateur est connecté
    if (!AuthService || !AuthService.isAuthenticated()) {
        return;
    }

    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Charger et afficher le profil
    async function loadProfile() {
        try {
            // Mettre à jour les informations du profil
            const nomProfil = document.querySelector('.nom-profil');
            const nomUtilisateurProfil = document.querySelector('.nom-utilisateur-profil');
            const bioProfil = document.querySelector('.bio-profil');
            const avatarProfil = document.querySelector('.avatar-profil');
            const localisationProfil = document.querySelector('.localisation-profil');
            const siteWebProfil = document.querySelector('.site-web-profil');
            const dateCreationProfil = document.querySelector('.date-creation-profil');
            const statistiquesProfil = document.querySelector('.statistiques-profil');

            if (nomProfil) nomProfil.textContent = currentUser.name;
            if (nomUtilisateurProfil) nomUtilisateurProfil.textContent = `@${currentUser.username}`;
            if (bioProfil) {
                bioProfil.textContent = currentUser.bio || 'Aucune bio pour le moment.';
            }
            if (avatarProfil) {
                avatarProfil.src = currentUser.profilePicture || 'images/user-avatar.png';
                avatarProfil.alt = `Photo de profil de ${currentUser.name}`;
            }

            // Mettre à jour les métadonnées
            if (localisationProfil) {
                if (currentUser.location) {
                    localisationProfil.textContent = `📍 ${currentUser.location}`;
                    localisationProfil.style.display = 'inline';
                } else {
                    localisationProfil.style.display = 'none';
                }
            }

            if (siteWebProfil) {
                if (currentUser.website) {
                    const link = siteWebProfil.querySelector('.lien-site-web');
                    if (link) {
                        link.href = currentUser.website;
                        link.textContent = currentUser.website.replace(/^https?:\/\//, '');
                    }
                    siteWebProfil.style.display = 'inline';
                } else {
                    siteWebProfil.style.display = 'none';
                }
            }

            if (dateCreationProfil) {
                const date = new Date(currentUser.createdAt);
                const mois = date.toLocaleDateString('fr-FR', { month: 'long' });
                const annee = date.getFullYear();
                dateCreationProfil.textContent = `Rejoint en ${mois} ${annee}`;
            }

            // Mettre à jour les statistiques
            if (statistiquesProfil) {
                const following = currentUser.following || 0;
                const followers = currentUser.followers || 0;
                statistiquesProfil.innerHTML = `
                    <span class="element-statistique">
                        <strong>${following}</strong> Abonnements
                    </span>
                    <span class="element-statistique">
                        <strong>${followers}</strong> Abonnés
                    </span>
                `;
            }

            // Charger les tweets de l'utilisateur
            await loadUserTweets();
        } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
        }
    }

    // Charger les tweets de l'utilisateur
    async function loadUserTweets() {
        const tweetsContainer = document.querySelector('.tweets-profil');
        if (!tweetsContainer) return;

        tweetsContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #71767b;">Chargement des tweets...</p>';

        try {
            const tweets = await TweetService.getUserTweets(currentUser.id);

            tweetsContainer.innerHTML = '';

            if (tweets.length === 0) {
                tweetsContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #71767b;">Aucun tweet pour le moment.</p>';
                return;
            }

            tweets.forEach(tweet => {
                const tweetElement = TweetService.createTweetElement(tweet, currentUser, currentUser.id);
                tweetsContainer.appendChild(tweetElement);
            });

            // Attacher les gestionnaires d'événements
            attachTweetEventHandlers();
        } catch (error) {
            console.error('Erreur lors du chargement des tweets:', error);
            tweetsContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #f4212e;">Erreur lors du chargement des tweets.</p>';
        }
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
                        await loadUserTweets();
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

    // Charger le profil au démarrage
    await loadProfile();
});

