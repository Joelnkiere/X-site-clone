// Compteur de caractères pour les tweets
document.addEventListener('DOMContentLoaded', function () {
    const contenuTweet = document.getElementById('contenuTweet');
    const compteurCaracteres = document.getElementById('compteurCaracteres');
    const boutonTweeter = document.querySelector('.bouton-tweeter');

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

    // Compteur pour les réponses dans tweet-detail.html
    const contenuReponse = document.getElementById('contenuReponse');
    const compteurReponse = document.querySelector('#formulaireReponse .compteur-caracteres span');

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
});

