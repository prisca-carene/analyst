document.addEventListener('DOMContentLoaded', () => {
    // Initialiser les icônes Lucide
    lucide.createIcons();

    // Éléments DOM
    const homePage = document.getElementById('home-page');
    const analysisPage = document.getElementById('analysis-page');
    const startButton = document.getElementById('start-button');
    const backButton = document.getElementById('back-button');
    const magnetInput = document.getElementById('magnet-input');
    const analyzeMagnetButton = document.getElementById('analyze-magnet');
    const magnetResult = document.getElementById('magnet-result');
    const torrentDropZone = document.getElementById('torrent-drop-zone');
    const torrentInput = document.getElementById('torrent-input');
    const torrentResult = document.getElementById('torrent-result');

    // Navigation
    startButton.addEventListener('click', () => {
        homePage.classList.add('hidden');
        analysisPage.classList.remove('hidden');
        document.getElementById('torrent-result').innerHTML = "";
        document.getElementById('magnet-result').innerHTML = "";
    });

    backButton.addEventListener('click', () => {
        analysisPage.classList.add('hidden');
        homePage.classList.remove('hidden');
    });

    // Analyse de lien magnet
    analyzeMagnetButton.addEventListener('click', async () => {
        const magnetLink = magnetInput.value.trim();
        if (!magnetLink) return;

        try {
            const response = await fetch('/api/analyze-magnet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ magnetLink })
            });

            const result = await response.json();
            displayMagnetResult(result);
            magnetInput.value = ''; // Réinitialiser l'input
        } catch (error) {
            displayMagnetResult({
                isValid: false,
                errorMessage: 'Erreur lors de l\'analyse du lien'
            });
        }
    });

    // Analyse de fichier torrent
    torrentDropZone.addEventListener('click', () => {
        torrentInput.click();
    });

    torrentInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('torrent', file);

        try {
            const response = await fetch('/api/analyze-torrent', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            displayTorrentResult(result);
        } catch (error) {
            displayTorrentResult({
                isValid: false,
                errorMessage: 'Erreur lors de l\'analyse du fichier'
            });
        }

        // Réinitialiser l'input file
        e.target.value = '';
    });

    // Fonctions d'affichage des résultats
    function displayMagnetResult(result) {
        magnetResult.className = 'result-container ' + (result.isValid ? 'success' : 'error');
        
        if (result.isValid) {
            magnetResult.innerHTML = `
                <div class="result-header">
                    <i data-lucide="check-circle-2" class="text-green-400"></i>
                    <span class="font-medium">Lien Magnet Valide</span>
                </div>
                <div class="result-content">
                    ${result.name ? `
                        <div class="result-item">
                            <span class="label">Nom:</span>
                            <p class="value">${result.name}</p>
                        </div>
                    ` : ''}
                    <div class="result-item">
                        <span class="label">Hash:</span>
                        <div class="hash-container">
                            <code>${result.hash}</code>
                            <button onclick="copyToClipboard('${result.hash}')" class="button text" title="Copier le hash">
                                <i data-lucide="copy"></i>
                            </button>
                        </div>
                    </div>
                    ${result.trackers.length > 0 ? `
                        <div class="result-item">
                            <span class="label">Trackers (${result.trackers.length}):</span>
                            <ul class="tracker-list">
                                ${result.trackers.map(tracker => `
                                    <li>${tracker}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            magnetResult.innerHTML = `
                <div class="result-header">
                    <i data-lucide="alert-circle" class="text-red-400"></i>
                    <span>${result.errorMessage}</span>
                </div>
            `;
        }

        lucide.createIcons();
    }

    function displayTorrentResult(result) {
        torrentResult.className = 'result-container ' + (result.isValid ? 'success' : 'error');
        
        if (result.isValid) {
            torrentResult.innerHTML = `
                <div class="result-header">
                    <i data-lucide="check-circle-2" class="text-green-400"></i>
                    <span class="font-medium">Fichier Torrent Valide</span>
                </div>
                <div class="result-content">
                    ${result.name ? `
                        <div class="result-item">
                            <span class="label">Nom:</span>
                            <p class="value">${result.name}</p>
                        </div>
                    ` : ''}
                    ${result.totalSize !== undefined ? `
                        <div class="result-item">
                            <span class="label">Taille totale:</span>
                            <p class="value">${(result.totalSize / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                    ` : ''}
                    ${result.creationDate ? `
                        <div class="result-item">
                            <span class="label">Date de création:</span>
                            <p class="value">${new Date(result.creationDate).toLocaleDateString()}</p>
                        </div>
                    ` : ''}
                    ${result.comment ? `
                        <div class="result-item">
                            <span class="label">Commentaire:</span>
                            <p class="value">${result.comment}</p>
                        </div>
                    ` : ''}
                    ${result.createdBy ? `
                        <div class="result-item">
                            <span class="label">Créé par:</span>
                            <p class="value">${result.createdBy}</p>
                        </div>
                    ` : ''}
                    ${result.isPrivate !== undefined ? `
                        <div class="result-item">
                            <span class="label">Type:</span>
                            <p class="value">${result.isPrivate ? 'Privé' : 'Public'}</p>
                        </div>
                    ` : ''}
                    ${result.announce ? `
                        <div class="result-item">
                            <span class="label">Tracker principal:</span>
                            <p class="value break-all">${result.announce}</p>
                        </div>
                    ` : ''}
                    ${result.announceList && result.announceList.length > 0 ? `
                        <div class="result-item">
                            <span class="label">Trackers additionnels (${result.announceList.length}):</span>
                            <ul class="tracker-list">
                                ${result.announceList.map(tracker => `
                                    <li>${tracker}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${result.files && result.files.length > 0 ? `
                        <div class="result-item">
                            <span class="label">Fichiers (${result.files.length}):</span>
                            <ul class="file-list">
                                ${result.files.map(file => `
                                    <li>${file.path.join('/')} (${(file.length / (1024 * 1024)).toFixed(2)} MB)</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            torrentResult.innerHTML = `
                <div class="result-header">
                    <i data-lucide="alert-circle" class="text-red-400"></i>
                    <span>${result.errorMessage}</span>
                </div>
            `;
        }

        lucide.createIcons();
    }
});

// Fonction utilitaire pour copier dans le presse-papier
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        // Vous pourriez ajouter une notification de succès ici
    } catch (err) {
        console.error('Erreur lors de la copie:', err);
    }
}