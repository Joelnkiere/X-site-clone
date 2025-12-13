// Script pour la bascule du mot de passe
document.addEventListener('DOMContentLoaded', function () {
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        const passwordInput = document.getElementById('password');
        const iconeOeil = togglePassword.querySelector('.icone-oeil');
        const iconeOeilFerme = togglePassword.querySelector('.icone-oeil-ferme');

        togglePassword.addEventListener('click', function () {
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

