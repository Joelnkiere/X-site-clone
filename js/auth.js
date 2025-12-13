// Script pour la bascule du mot de passe
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
                iconeOeil.style.display = 'none';
                iconeOeilFerme.style.display = 'block';
            } else {
                passwordInput.type = 'password';
                iconeOeil.style.display = 'block';
                iconeOeilFerme.style.display = 'none';
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
                iconeOeilSignup.style.display = 'none';
                iconeOeilFermeSignup.style.display = 'block';
            } else {
                passwordInputSignup.type = 'password';
                iconeOeilSignup.style.display = 'block';
                iconeOeilFermeSignup.style.display = 'none';
            }
        });
    }
});

// Script pour basculer entre téléphone et email dans signup-form.html
document.addEventListener('DOMContentLoaded', function () {
    const useEmailLink = document.getElementById('useEmailLink');
    const phoneInput = document.getElementById('phone');

    if (useEmailLink && phoneInput) {
        useEmailLink.addEventListener('click', function (e) {
            e.preventDefault();
            phoneInput.type = phoneInput.type === 'tel' ? 'email' : 'tel';
            phoneInput.placeholder = phoneInput.type === 'email' ? 'Email' : 'Téléphone';
            useEmailLink.textContent = phoneInput.type === 'email' ? 'Utiliser un téléphone' : 'Utiliser un email';
        });
    }
});

// Script pour remplir dynamiquement les jours et années dans signup-form.html
document.addEventListener('DOMContentLoaded', function () {
    const monthSelect = document.getElementById('month');
    const daySelect = document.getElementById('day');
    const yearSelect = document.getElementById('year');

    // Remplir les années (de 1920 à l'année actuelle)
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= 1920; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }

    // Fonction pour mettre à jour les jours selon le mois sélectionné
    function updateDays() {
        if (!monthSelect || !daySelect) return;

        const month = parseInt(monthSelect.value);
        const selectedDay = daySelect.value;

        // Vider les options existantes (sauf la première)
        daySelect.innerHTML = '<option value="">Jour</option>';

        if (month) {
            let daysInMonth = 31;

            // Mois avec 30 jours
            if ([4, 6, 9, 11].includes(month)) {
                daysInMonth = 30;
            }
            // Février
            else if (month === 2) {
                const year = parseInt(yearSelect.value) || new Date().getFullYear();
                // Année bissextile
                if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
                    daysInMonth = 29;
                } else {
                    daysInMonth = 28;
                }
            }

            // Remplir les jours
            for (let day = 1; day <= daysInMonth; day++) {
                const option = document.createElement('option');
                option.value = day.toString().padStart(2, '0');
                option.textContent = day;
                daySelect.appendChild(option);
            }

            // Restaurer la sélection si elle existe toujours
            if (selectedDay && parseInt(selectedDay) <= daysInMonth) {
                daySelect.value = selectedDay;
            }
        }
    }

    // Écouter les changements de mois
    if (monthSelect) {
        monthSelect.addEventListener('change', updateDays);
    }

    // Écouter les changements d'année (pour février)
    if (yearSelect) {
        yearSelect.addEventListener('change', function () {
            if (monthSelect.value === '02') {
                updateDays();
            }
        });
    }
});

// ============================================
// MODULE D'AUTHENTIFICATION
// ============================================

const API_BASE_URL = 'http://localhost:3000';

// Gestion de la session utilisateur
const AuthService = {
    // Sauvegarder l'utilisateur connecté
    setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    },

    // Récupérer l'utilisateur connecté
    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    // Vérifier si un utilisateur est connecté
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    },

    // Déconnecter l'utilisateur
    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    },

    // Générer un username unique à partir du nom
    generateUsername(name) {
        const baseUsername = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 15);

        return baseUsername;
    },

    // Vérifier si un email existe déjà
    async checkEmailExists(email) {
        try {
            const response = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}`);
            const users = await response.json();
            return users.length > 0;
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'email:', error);
            return false;
        }
    },

    // Vérifier si un téléphone existe déjà
    async checkPhoneExists(phone) {
        try {
            const response = await fetch(`${API_BASE_URL}/users?phone=${encodeURIComponent(phone)}`);
            const users = await response.json();
            return users.length > 0;
        } catch (error) {
            console.error('Erreur lors de la vérification du téléphone:', error);
            return false;
        }
    },

    // Vérifier si un username existe déjà
    async checkUsernameExists(username) {
        try {
            const response = await fetch(`${API_BASE_URL}/users?username=${encodeURIComponent(username)}`);
            const users = await response.json();
            return users.length > 0;
        } catch (error) {
            console.error('Erreur lors de la vérification du username:', error);
            return false;
        }
    },

    // Générer un ID unique pour un nouvel utilisateur
    async getNextUserId() {
        try {
            const response = await fetch(`${API_BASE_URL}/users?_sort=id&_order=desc&_limit=1`);
            const users = await response.json();
            return users.length > 0 ? users[0].id + 1 : 1;
        } catch (error) {
            console.error('Erreur lors de la récupération du prochain ID:', error);
            return 1;
        }
    },

    // Trouver un username unique
    async findUniqueUsername(baseUsername) {
        let username = baseUsername;
        let counter = 1;

        while (await this.checkUsernameExists(username)) {
            username = `${baseUsername}${counter}`;
            counter++;
        }

        return username;
    },

    // Afficher un message d'erreur
    showError(message) {
        // Créer ou mettre à jour un élément d'erreur
        let errorElement = document.getElementById('errorMessage');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'errorMessage';
            errorElement.style.cssText = `
                background-color: #f4212e;
                color: white;
                padding: 12px 16px;
                border-radius: 4px;
                margin-bottom: 16px;
                font-size: 15px;
            `;
            const form = document.querySelector('.formulaire-authentification');
            if (form) {
                form.insertBefore(errorElement, form.firstChild);
            }
        }
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    },

    // Masquer le message d'erreur
    hideError() {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
};

// ============================================
// INSCRIPTION (signup-form.html)
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signupForm');

    if (signupForm) {
        signupForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            AuthService.hideError();

            const name = document.getElementById('name').value.trim();
            const phoneInput = document.getElementById('phone');
            const phone = phoneInput.type === 'tel' ? phoneInput.value.trim() : '';
            const email = phoneInput.type === 'email' ? phoneInput.value.trim() : '';
            const password = document.getElementById('password').value;
            const month = document.getElementById('month').value;
            const day = document.getElementById('day').value;
            const year = document.getElementById('year').value;

            // Validation
            if (!name) {
                AuthService.showError('Veuillez entrer votre nom et prénom.');
                return;
            }

            if (!email && !phone) {
                AuthService.showError('Veuillez entrer un email ou un numéro de téléphone.');
                return;
            }

            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                AuthService.showError('Veuillez entrer une adresse email valide.');
                return;
            }

            if (!password || password.length < 6) {
                AuthService.showError('Le mot de passe doit contenir au moins 6 caractères.');
                return;
            }

            if (!month || !day || !year) {
                AuthService.showError('Veuillez sélectionner votre date de naissance complète.');
                return;
            }

            // Vérifier l'âge (doit avoir au moins 13 ans)
            const birthDate = new Date(`${year}-${month}-${day}`);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 13) {
                AuthService.showError('Vous devez avoir au moins 13 ans pour créer un compte.');
                return;
            }

            try {
                // Vérifier si l'email existe déjà
                if (email && await AuthService.checkEmailExists(email)) {
                    AuthService.showError('Cet email est déjà utilisé. Veuillez en choisir un autre.');
                    return;
                }

                // Vérifier si le téléphone existe déjà
                if (phone && await AuthService.checkPhoneExists(phone)) {
                    AuthService.showError('Ce numéro de téléphone est déjà utilisé. Veuillez en choisir un autre.');
                    return;
                }

                // Générer un username unique
                const baseUsername = AuthService.generateUsername(name);
                const username = await AuthService.findUniqueUsername(baseUsername);

                // Générer un ID unique
                const id = await AuthService.getNextUserId();

                // Créer l'utilisateur
                const newUser = {
                    id: id,
                    name: name,
                    username: username,
                    email: email || '',
                    password: password,
                    phone: phone || '',
                    profilePicture: '',
                    bio: '',
                    location: '',
                    website: '',
                    createdAt: new Date().toISOString(),
                    followers: 0,
                    following: 0
                };

                const response = await fetch(`${API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newUser)
                });

                if (response.ok) {
                    const createdUser = await response.json();
                    // Connecter automatiquement l'utilisateur après l'inscription
                    AuthService.setCurrentUser(createdUser);
                    // Rediriger vers la page d'accueil
                    alert('Compte créé avec succès ! Bienvenue sur X Clone.');
                    window.location.href = 'index.html';
                } else {
                    AuthService.showError('Une erreur est survenue lors de la création du compte. Veuillez réessayer.');
                }
            } catch (error) {
                console.error('Erreur lors de l\'inscription:', error);
                AuthService.showError('Une erreur est survenue. Veuillez vérifier que le serveur est démarré.');
            }
        });
    }
});

// ============================================
// LOGIN ÉTAPE 1 (login-step2.html)
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            AuthService.hideError();

            const identifier = document.getElementById('identifier').value.trim();

            if (!identifier) {
                AuthService.showError('Veuillez entrer un identifiant.');
                return;
            }

            try {
                // Chercher l'utilisateur par email, téléphone ou username
                const response = await fetch(`${API_BASE_URL}/users`);
                const users = await response.json();

                const user = users.find(u =>
                    u.email === identifier ||
                    u.phone === identifier ||
                    u.username === identifier
                );

                if (user) {
                    // Stocker l'utilisateur trouvé pour l'étape suivante
                    sessionStorage.setItem('loginUser', JSON.stringify(user));
                    // Rediriger vers la page de mot de passe
                    window.location.href = 'login-password.html';
                } else {
                    AuthService.showError('Aucun compte trouvé avec cet identifiant.');
                }
            } catch (error) {
                console.error('Erreur lors de la connexion:', error);
                AuthService.showError('Une erreur est survenue. Veuillez vérifier que le serveur est démarré.');
            }
        });
    }
});

// ============================================
// LOGIN ÉTAPE 2 (login-password.html)
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    const loginPasswordForm = document.getElementById('loginPasswordForm');

    if (loginPasswordForm) {
        // Vérifier si on a un utilisateur en session
        const loginUserStr = sessionStorage.getItem('loginUser');
        if (!loginUserStr) {
            // Rediriger vers la page de login si pas d'utilisateur en session
            window.location.href = 'login-step2.html';
            return;
        }

        loginPasswordForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            AuthService.hideError();

            const password = document.getElementById('password').value;
            const loginUser = JSON.parse(sessionStorage.getItem('loginUser'));

            if (!password) {
                AuthService.showError('Veuillez entrer votre mot de passe.');
                return;
            }

            // Vérifier le mot de passe
            if (loginUser.password === password) {
                // Mot de passe correct - connecter l'utilisateur
                AuthService.setCurrentUser(loginUser);
                sessionStorage.removeItem('loginUser');

                // Rediriger vers la page d'accueil
                window.location.href = 'index.html';
            } else {
                AuthService.showError('Mot de passe incorrect.');
            }
        });
    }
});

