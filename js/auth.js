// ============================================
// AUTHENTIFICATION - FONCTIONS SIMPLES
// ============================================

const API_BASE_URL = 'http://localhost:3000';

// ============================================
// GESTION DE LA SESSION UTILISATEUR
// ============================================

// Sauvegarder l'utilisateur connecté
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('sessionTimestamp', Date.now().toString());
}

// Récupérer l'utilisateur connecté
function getCurrentUser() {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
        return JSON.parse(userString);
    }
    return null;
}

// Vérifier si un utilisateur est connecté
function isAuthenticated() {
    const user = getCurrentUser();
    if (!user) {
        return false;
    }

    // Vérifier si la session n'a pas expiré (24h)
    const timestamp = localStorage.getItem('sessionTimestamp');
    if (timestamp) {
        const sessionAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 heures
        if (sessionAge > maxAge) {
            logout(false);
            return false;
        }
    }

    return true;
}

// Déconnecter l'utilisateur
function logout(redirect) {
    if (redirect === undefined) {
        redirect = true;
    }
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionTimestamp');
    localStorage.removeItem('likedTweets');
    localStorage.removeItem('retweetedTweets');
    localStorage.removeItem('bookmarks');
    if (redirect) {
        window.location.href = 'login.html';
    }
}

// ============================================
// VÉRIFICATION DES DONNÉES
// ============================================

// Vérifier si un email existe déjà
async function checkEmailExists(email) {
    try {
        const response = await fetch(API_BASE_URL + '/users?email=' + encodeURIComponent(email));
        const users = await response.json();
        return users.length > 0;
    } catch (error) {
        console.error('Erreur:', error);
        return false;
    }
}

// Vérifier si un téléphone existe déjà
async function checkPhoneExists(phone) {
    try {
        const response = await fetch(API_BASE_URL + '/users?phone=' + encodeURIComponent(phone));
        const users = await response.json();
        return users.length > 0;
    } catch (error) {
        console.error('Erreur:', error);
        return false;
    }
}

// Vérifier si un username existe déjà
async function checkUsernameExists(username) {
    try {
        const response = await fetch(API_BASE_URL + '/users?username=' + encodeURIComponent(username));
        const users = await response.json();
        return users.length > 0;
    } catch (error) {
        console.error('Erreur:', error);
        return false;
    }
}

// ============================================
// GÉNÉRATION D'IDENTIFIANTS
// ============================================

// Générer un username à partir du nom
function generateUsername(name) {
    let username = name.toLowerCase();
    // Supprimer les accents
    username = username.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Garder uniquement les lettres et chiffres
    username = username.replace(/[^a-z0-9]/g, '');
    // Limiter à 15 caractères
    username = username.substring(0, 15);
    return username;
}

// Générer un ID unique pour un nouvel utilisateur
async function getNextUserId() {
    try {
        const response = await fetch(API_BASE_URL + '/users');
        const users = await response.json();
        if (users.length === 0) {
            return '1';
        }
        let maxId = 0;
        for (let i = 0; i < users.length; i++) {
            const id = parseInt(users[i].id);
            if (id > maxId) {
                maxId = id;
            }
        }
        return (maxId + 1).toString();
    } catch (error) {
        console.error('Erreur:', error);
        return '1';
    }
}

// Trouver un username unique
async function findUniqueUsername(baseUsername) {
    let username = baseUsername;
    let counter = 1;

    while (await checkUsernameExists(username)) {
        username = baseUsername + counter;
        counter = counter + 1;
    }

    return username;
}

// ============================================
// AFFICHAGE DES MESSAGES
// ============================================

// Afficher un message d'erreur
function showAuthError(message) {
    let errorElement = document.getElementById('errorMessage');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'errorMessage';
        errorElement.style.cssText = 'background-color: rgba(244, 33, 46, 0.1); border: 1px solid #f4212e; color: #f4212e; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 15px;';
        const form = document.querySelector('.formulaire-authentification');
        if (form) {
            form.insertBefore(errorElement, form.firstChild);
        }
    }
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Masquer le message d'erreur
function hideAuthError() {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Afficher un message de succès
function showAuthSuccess(message) {
    let successElement = document.getElementById('successMessage');
    if (!successElement) {
        successElement = document.createElement('div');
        successElement.id = 'successMessage';
        successElement.style.cssText = 'background-color: rgba(0, 186, 124, 0.1); border: 1px solid #00ba7c; color: #00ba7c; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 15px;';
        const form = document.querySelector('.formulaire-authentification');
        if (form) {
            form.insertBefore(successElement, form.firstChild);
        }
    }
    successElement.textContent = message;
    successElement.style.display = 'block';
    setTimeout(function () {
        successElement.style.display = 'none';
    }, 3000);
}

// ============================================
// BASCULE DU MOT DE PASSE
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    // Pour login-password.html
    const voirMotDePasse = document.getElementById('voirMotDePasse');
    if (voirMotDePasse) {
        const passwordInput = document.getElementById('password');
        const iconeOeil = voirMotDePasse.querySelector('.icone-oeil');
        const iconeOeilFerme = voirMotDePasse.querySelector('.icone-oeil-ferme');

        voirMotDePasse.addEventListener('click', function () {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                if (iconeOeil) iconeOeil.style.display = 'none';
                if (iconeOeilFerme) iconeOeilFerme.style.display = 'block';
            } else {
                passwordInput.type = 'password';
                if (iconeOeil) iconeOeil.style.display = 'block';
                if (iconeOeilFerme) iconeOeilFerme.style.display = 'none';
            }
        });
    }

    // Pour signup-form.html
    const togglePasswordSignup = document.getElementById('togglePasswordSignup');
    if (togglePasswordSignup) {
        const passwordInputSignup = document.getElementById('password');
        const iconeOeilSignup = togglePasswordSignup.querySelector('.icone-oeil');
        const iconeOeilFermeSignup = togglePasswordSignup.querySelector('.icone-oeil-ferme');

        togglePasswordSignup.addEventListener('click', function () {
            if (passwordInputSignup.type === 'password') {
                passwordInputSignup.type = 'text';
                if (iconeOeilSignup) iconeOeilSignup.style.display = 'none';
                if (iconeOeilFermeSignup) iconeOeilFermeSignup.style.display = 'block';
            } else {
                passwordInputSignup.type = 'password';
                if (iconeOeilSignup) iconeOeilSignup.style.display = 'block';
                if (iconeOeilFermeSignup) iconeOeilFermeSignup.style.display = 'none';
            }
        });
    }
});

// ============================================
// BASCULE TÉLÉPHONE/EMAIL
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    const useEmailLink = document.getElementById('useEmailLink');
    const phoneInput = document.getElementById('phone');

    if (useEmailLink && phoneInput) {
        useEmailLink.addEventListener('click', function (e) {
            e.preventDefault();
            if (phoneInput.type === 'tel') {
                phoneInput.type = 'email';
                phoneInput.placeholder = 'Email';
                useEmailLink.textContent = 'Utiliser un téléphone';
            } else {
                phoneInput.type = 'tel';
                phoneInput.placeholder = 'Téléphone';
                useEmailLink.textContent = 'Utiliser un email';
            }
        });
    }
});

// ============================================
// REMPLISSAGE DES JOURS ET ANNÉES
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    const monthSelect = document.getElementById('month');
    const daySelect = document.getElementById('day');
    const yearSelect = document.getElementById('year');

    // Remplir les années
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= 1920; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }

    // Fonction pour mettre à jour les jours
    function updateDays() {
        if (!monthSelect || !daySelect) return;

        const month = parseInt(monthSelect.value);
        const selectedDay = daySelect.value;

        daySelect.innerHTML = '<option value="">Jour</option>';

        if (month) {
            let daysInMonth = 31;

            if (month === 4 || month === 6 || month === 9 || month === 11) {
                daysInMonth = 30;
            } else if (month === 2) {
                const year = parseInt(yearSelect.value) || new Date().getFullYear();
                if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
                    daysInMonth = 29;
                } else {
                    daysInMonth = 28;
                }
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const option = document.createElement('option');
                if (day < 10) {
                    option.value = '0' + day;
                } else {
                    option.value = day.toString();
                }
                option.textContent = day;
                daySelect.appendChild(option);
            }

            if (selectedDay && parseInt(selectedDay) <= daysInMonth) {
                daySelect.value = selectedDay;
            }
        }
    }

    if (monthSelect) {
        monthSelect.addEventListener('change', updateDays);
    }

    if (yearSelect) {
        yearSelect.addEventListener('change', function () {
            if (monthSelect.value === '02') {
                updateDays();
            }
        });
    }
});

// ============================================
// INSCRIPTION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signupForm');

    if (signupForm) {
        signupForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            hideAuthError();

            const name = document.getElementById('name').value.trim();
            const phoneInput = document.getElementById('phone');
            let phone = '';
            let email = '';

            if (phoneInput.type === 'tel') {
                phone = phoneInput.value.trim();
            } else {
                email = phoneInput.value.trim();
            }

            const password = document.getElementById('password').value;
            const month = document.getElementById('month').value;
            const day = document.getElementById('day').value;
            const year = document.getElementById('year').value;

            // Validation du nom
            if (!name) {
                showAuthError('Veuillez entrer votre nom.');
                return;
            }

            // Validation email/téléphone
            if (!email && !phone) {
                showAuthError('Veuillez entrer un email ou un téléphone.');
                return;
            }

            // Validation format email
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showAuthError('Email invalide.');
                    return;
                }
            }

            // Validation mot de passe
            if (!password || password.length < 6) {
                showAuthError('Le mot de passe doit contenir au moins 6 caractères.');
                return;
            }

            // Validation date de naissance
            if (!month || !day || !year) {
                showAuthError('Veuillez sélectionner votre date de naissance.');
                return;
            }

            // Vérifier l'âge (minimum 13 ans)
            const birthDate = new Date(year + '-' + month + '-' + day);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age = age - 1;
            }

            if (age < 13) {
                showAuthError('Vous devez avoir au moins 13 ans.');
                return;
            }

            try {
                // Vérifier si l'email existe
                if (email) {
                    const emailExists = await checkEmailExists(email);
                    if (emailExists) {
                        showAuthError('Cet email est déjà utilisé.');
                        return;
                    }
                }

                // Vérifier si le téléphone existe
                if (phone) {
                    const phoneExists = await checkPhoneExists(phone);
                    if (phoneExists) {
                        showAuthError('Ce numéro est déjà utilisé.');
                        return;
                    }
                }

                // Générer un username unique
                const baseUsername = generateUsername(name);
                const username = await findUniqueUsername(baseUsername);

                // Générer un ID unique
                const id = await getNextUserId();

                // Créer l'utilisateur
                const newUser = {
                    id: id,
                    name: name,
                    username: username,
                    email: email,
                    password: password,
                    phone: phone,
                    profilePicture: '',
                    bannerPicture: '',
                    bio: '',
                    location: '',
                    website: '',
                    createdAt: new Date().toISOString(),
                    followers: 0,
                    following: 0,
                    likedTweets: [],
                    retweetedTweets: [],
                    bookmarks: []
                };

                // Envoyer au serveur
                const response = await fetch(API_BASE_URL + '/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser)
                });

                if (response.ok) {
                    const createdUser = await response.json();
                    setCurrentUser(createdUser);
                    showAuthSuccess('Compte créé !');
                    setTimeout(function () {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    showAuthError('Erreur lors de la création du compte.');
                }

            } catch (error) {
                console.error('Erreur:', error);
                showAuthError('Erreur de connexion au serveur.');
            }
        });
    }
});

// ============================================
// CONNEXION ÉTAPE 1
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            hideAuthError();

            const identifier = document.getElementById('identifier').value.trim();

            if (!identifier) {
                showAuthError('Veuillez entrer un identifiant.');
                return;
            }

            try {
                const response = await fetch(API_BASE_URL + '/users');
                const users = await response.json();

                let foundUser = null;
                for (let i = 0; i < users.length; i++) {
                    const user = users[i];
                    if (user.email === identifier || user.phone === identifier || user.username === identifier) {
                        foundUser = user;
                        break;
                    }
                }

                if (foundUser) {
                    sessionStorage.setItem('loginUser', JSON.stringify(foundUser));
                    window.location.href = 'login-password.html';
                } else {
                    showAuthError('Aucun compte trouvé.');
                }

            } catch (error) {
                console.error('Erreur:', error);
                showAuthError('Erreur de connexion au serveur.');
            }
        });
    }
});

// ============================================
// CONNEXION ÉTAPE 2
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    const loginPasswordForm = document.getElementById('loginPasswordForm');

    if (loginPasswordForm) {
        const loginUserStr = sessionStorage.getItem('loginUser');
        if (!loginUserStr) {
            window.location.href = 'login-step2.html';
            return;
        }

        const loginUser = JSON.parse(loginUserStr);

        // Afficher le nom d'utilisateur
        const usernameDisplay = document.getElementById('usernameDisplay');
        if (usernameDisplay) {
            usernameDisplay.textContent = '@' + loginUser.username;
        }

        loginPasswordForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            hideAuthError();

            const password = document.getElementById('password').value;

            if (!password) {
                showAuthError('Veuillez entrer votre mot de passe.');
                return;
            }

            if (loginUser.password === password) {
                // Rafraîchir les données depuis le serveur
                try {
                    const response = await fetch(API_BASE_URL + '/users/' + loginUser.id);
                    if (response.ok) {
                        const freshUser = await response.json();
                        setCurrentUser(freshUser);
                        localStorage.setItem('likedTweets', JSON.stringify(freshUser.likedTweets || []));
                        localStorage.setItem('retweetedTweets', JSON.stringify(freshUser.retweetedTweets || []));
                        localStorage.setItem('bookmarks', JSON.stringify(freshUser.bookmarks || []));
                    } else {
                        setCurrentUser(loginUser);
                    }
                } catch (error) {
                    setCurrentUser(loginUser);
                }

                sessionStorage.removeItem('loginUser');
                window.location.href = 'index.html';
            } else {
                showAuthError('Mot de passe incorrect.');
            }
        });
    }
});
