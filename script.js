class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.webhookUrl = 'https://discord.com/api/webhooks/1453369571909042238/NoeJHdPY6puZ4dynrEuF1NMtLNzDIjqTtQ9cwZkJluZq4_SbgsM9sV1_0aYvjlUo3T6E';
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.originalPlaylist = [];
        this.volume = 0.5;
        this.reviews = this.loadReviewsFromStorage();
        this.playlistBtn = document.querySelector('.action-btn.playlist');
        this.nextTrackId = null;
        this.customPlaylist = this.loadCustomPlaylist();
        this.progressBar = null;

        this.playBtn = document.querySelector('.control-btn.play img');
        this.prevBtn = document.querySelector('.control-btn.previous');
        this.nextBtn = document.querySelector('.control-btn.next');
        this.shuffleBtn = document.querySelector('.action-btn.shuffle');
        this.titleElement = document.querySelector('.title');
        this.subtitleElement = document.querySelector('.subtitle');
        this.favoriteBtn = document.querySelector('.action-btn.favorite');
        this.settingsBtn = document.querySelector('.action-btn.share');

        this.createVolumeControl();
        this.createReviewPopup();
        this.createPlaylistPopup();
        this.createProgressBar();
        this.initializeEventListeners();
        this.loadPlaylist();
    // PROMOTED TRACK: change this value to set which track the intro promote
    this.introTracks = ['track30'];
        this.createIntroPopup();
        this.initAnalytics();
    }

    createVolumeControl() {
        const volumePopup = document.createElement('div');
        volumePopup.className = 'volume-popup';
        volumePopup.innerHTML = `
            <button class="volume-btn up">
                <img src="icon/up.svg" alt="Volume Up">
            </button>
            <div class="volume-value">${Math.round(this.volume * 100)}%</div>
            <button class="volume-btn down">
                <img src="icon/down.svg" alt="Volume Down">
            </button>
        `;
        document.querySelector('.player-container').appendChild(volumePopup);

        const style = document.createElement('style');
        style.textContent = `
            .volume-popup {
                position: fixed;
                right: 20px;
                bottom: 80px;
                background: rgba(8, 7, 27, 0.95);
                border-radius: 15px;
                padding: 1rem;
                display: none;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
                backdrop-filter: blur(10px);
                z-index: 1000;
                border: 1px solid rgba(180, 122, 255, 0.2);
            }
            .volume-popup.active {
                display: flex;
            }
            .volume-btn {
                background: none;
                border: none;
                color: #B47AFF;
                cursor: pointer;
                padding: 0.5rem;
                transition: transform 0.2s;
            }
            .volume-btn:hover {
                transform: scale(1.1);
            }
            .volume-btn img {
                width: 24px;
                height: 24px;
            }
            .volume-value {
                color: #B47AFF;
                font-size: 1rem;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);

        this.volumePopup = volumePopup;
    }

    createReviewPopup() {
        const reviewPopup = document.createElement('div');
        reviewPopup.className = 'review-popup';
        reviewPopup.innerHTML = `
            <div class="review-content">
                <h3>Donnez votre avis</h3>
                <form name="music-review" data-netlify="true">
                    <input type="hidden" name="form-name" value="music-review">
                    <textarea name="review-text" placeholder="Écrivez votre avis ici..." maxlength="200"></textarea>
                    <div class="review-actions">
                        <button type="button" class="cancel-btn">Annuler</button>
                        <button type="submit" class="submit-btn">Envoyer</button>
                    </div>
                </form>
            </div>
        `;
        document.querySelector('.player-container').appendChild(reviewPopup);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes heartBeat {
                0% { transform: scale(1); }
                25% { transform: scale(1.2); }
                50% { transform: scale(1); }
                75% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }

            .action-btn.favorite.liked img {
                animation: heartBeat 0.8s ease-in-out;
                filter: brightness(1.2) hue-rotate(315deg);
            }

            .review-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(8, 7, 27, 0.8);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                backdrop-filter: blur(5px);
            }

            .review-popup.active {
                display: flex;
            }

            .review-content {
                background: rgba(8, 7, 27, 0.95);
                border-radius: 20px;
                padding: 1.5rem;
                width: 90%;
                max-width: 400px;
                border: 1px solid rgba(180, 122, 255, 0.2);
            }

            .review-content h3 {
                color: #B47AFF;
                margin-bottom: 1rem;
                text-align: center;
                font-size: 1.2rem;
            }

            .review-content textarea {
                width: 100%;
                height: 120px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(180, 122, 255, 0.3);
                border-radius: 10px;
                padding: 0.8rem;
                color: #fff;
                font-size: 1rem;
                resize: none;
                margin-bottom: 1rem;
            }

            .review-content textarea:focus {
                outline: none;
                border-color: #B47AFF;
            }

            .review-actions {
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
            }

            .review-actions button {
                padding: 0.5rem 1rem;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.2s;
            }

            .cancel-btn {
                background: rgba(255, 255, 255, 0.1);
                color: #B47AFF;
            }

            .submit-btn {
                background: #B47AFF;
                color: #fff;
            }

            .review-actions button:hover {
                transform: scale(1.05);
            }

            .reviews-list {
                position: fixed;
                bottom: 80px;
                left: 20px;
                right: 20px;
                background: rgba(8, 7, 27, 0.95);
                border-radius: 15px;
                padding: 1rem;
                display: none;
                flex-direction: column;
                gap: 0.8rem;
                max-height: 300px;
                overflow-y: auto;
                border: 1px solid rgba(180, 122, 255, 0.2);
                z-index: 1000;
            }

            .reviews-list.active {
                display: flex;
            }

            .review-item {
                background: rgba(255, 255, 255, 0.05);
                padding: 0.8rem;
                border-radius: 8px;
                color: #fff;
            }

            .review-date {
                color: #B47AFF;
                font-size: 0.8rem;
                margin-bottom: 0.3rem;
            }
        `;
        document.head.appendChild(style);

        this.reviewPopup = reviewPopup;
    }

    createPlaylistPopup() {
        const playlistPopup = document.createElement('div');
        playlistPopup.className = 'playlist-popup';
        playlistPopup.innerHTML = `
            <div class="playlist-content">
                <div class="playlist-header">
                    <h3>Playlist</h3>
                    <button class="close-playlist">×</button>
                </div>
                <div class="playlist-tabs">
                    <button class="tab-btn active" data-tab="all">Toutes les pistes</button>
                    <button class="tab-btn" data-tab="custom">Ma playlist</button>
                </div>
                <div class="playlist-list"></div>
            </div>
        `;
        document.querySelector('.player-container').appendChild(playlistPopup);

        const style = document.createElement('style');
        style.textContent = `
            .playlist-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(8, 7, 27, 0.8);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                backdrop-filter: blur(5px);
            }

            .playlist-popup.active {
                display: flex;
            }

            .playlist-content {
                background: rgba(8, 7, 27, 0.95);
                border-radius: 20px;
                padding: 1.5rem;
                width: 90%;
                max-width: 400px;
                max-height: 80vh;
                border: 1px solid rgba(180, 122, 255, 0.2);
                display: flex;
                flex-direction: column;
            }

            .playlist-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid rgba(180, 122, 255, 0.2);
            }

            .playlist-header h3 {
                color: #B47AFF;
                margin: 0;
                font-size: 1.2rem;
            }

            .close-playlist {
                background: none;
                border: none;
                color: #B47AFF;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.2rem 0.5rem;
                transition: transform 0.2s;
            }

            .close-playlist:hover {
                transform: scale(1.1);
            }

            .playlist-list {
                overflow-y: auto;
                flex: 1;
                padding-right: 0.5rem;
            }

            .playlist-item {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 0.8rem;
                margin-bottom: 0.5rem;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .playlist-item:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateX(5px);
            }

            .playlist-item.active {
                background: rgba(180, 122, 255, 0.2);
                border-left: 3px solid #B47AFF;
            }

            .playlist-item.next {
                background: rgba(180, 122, 255, 0.1);
                border-left: 3px solid #DB00EC;
            }

            .playlist-item-title {
                color: #fff;
                font-size: 0.9rem;
            }

            .playlist-item-instruments {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.8rem;
            }

            .playlist-item-info {
                flex: 1;
            }

            .playlist-item-actions {
                display: flex;
                gap: 0.5rem;
            }

            .playlist-item-actions button {
                background: none;
                border: none;
                color: #B47AFF;
                cursor: pointer;
                padding: 0.3rem;
                transition: transform 0.2s;
            }

            .playlist-item-actions button:hover {
                transform: scale(1.1);
            }

            .playlist-tabs {
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
                border-bottom: 1px solid rgba(180, 122, 255, 0.2);
                padding-bottom: 0.5rem;
            }

            .tab-btn {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                cursor: pointer;
                padding: 0.5rem 1rem;
                font-size: 0.9rem;
                transition: all 0.2s;
            }

            .tab-btn.active {
                color: #B47AFF;
                border-bottom: 2px solid #B47AFF;
            }

            .playlist-item.selected {
                background: rgba(180, 122, 255, 0.3);
                border-left: 3px solid #DB00EC;
            }
        `;
        document.head.appendChild(style);

        this.playlistPopup = playlistPopup;
    }

    createProgressBar() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.innerHTML = `
            <div class="progress-bar">
                <div class="progress"></div>
            </div>
            <div class="time-info">
                <span class="current-time">0:00</span>
                <span class="duration">0:00</span>
            </div>
        `;
        document.querySelector('.player-container').appendChild(progressContainer);

        const style = document.createElement('style');
        style.textContent = `
            .progress-container {
                position: fixed;
                bottom: 120px;
                left: 20px;
                right: 20px;
                z-index: 100;
            }

            .progress-bar {
                width: 100%;
                height: 4px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
                cursor: pointer;
                position: relative;
                margin-bottom: 0.5rem;
            }

            .progress {
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                background: #B47AFF;
                border-radius: 2px;
                width: 0%;
                transition: width 0.1s linear;
            }

            .time-info {
                display: flex;
                justify-content: space-between;
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.8rem;
            }
        `;
        document.head.appendChild(style);

        this.progressBar = progressContainer;
    }

    async loadPlaylist() {
        try {
            const response = await fetch('../config.json');
            const data = await response.json();
            this.playlist = data.playlist;
            this.originalPlaylist = [...this.playlist];
            this.loadTrack(0);
            this.audio.volume = this.volume;
        } catch (error) {
            console.error('Erreur lors du chargement de la playlist:', error);
        }
    }

    loadReviewsFromStorage() {
        try {
            const savedReviews = localStorage.getItem('musicReviews');
            return savedReviews ? JSON.parse(savedReviews) : {};
        } catch (error) {
            console.error('Erreur lors du chargement des avis:', error);
            return {};
        }
    }

    saveReviewsToStorage() {
        try {
            localStorage.setItem('musicReviews', JSON.stringify(this.reviews));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des avis:', error);
        }
    }

    loadCustomPlaylist() {
        try {
            const savedPlaylist = localStorage.getItem('customPlaylist');
            return savedPlaylist ? JSON.parse(savedPlaylist) : [];
        } catch (error) {
            console.error('Erreur lors du chargement de la playlist personnalisée:', error);
            return [];
        }
    }

    saveCustomPlaylist() {
        try {
            localStorage.setItem('customPlaylist', JSON.stringify(this.customPlaylist));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la playlist personnalisée:', error);
        }
    }

    initializeEventListeners() {
        document.querySelector('.control-btn.play').addEventListener('click', () => this.togglePlay());
    
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());
    
        this.shuffleBtn.addEventListener('click', () => this.playRandom());
    
        this.audio.addEventListener('ended', () => {
            console.log('Événement ended déclenché');
            console.log('nextTrackId:', this.nextTrackId);
            console.log('currentTrackIndex:', this.currentTrackIndex);
            console.log('isPlaying:', this.isPlaying);
            
            if (this.nextTrackId) {
                console.log('Une piste suivante est définie:', this.nextTrackId);
                const nextIndex = this.playlist.findIndex(track => track.id === this.nextTrackId);
                console.log('Index de la piste suivante:', nextIndex);
                if (nextIndex !== -1) {
                    console.log('Chargement de la piste suivante');
                    this.loadTrack(nextIndex);
                    if (this.isPlaying) {
                        console.log('Reprise de la lecture');
                        this.audio.play().catch(error => {
                            console.log('Erreur de lecture:', error);
                        });
                    }
                    this.nextTrackId = null;
                }
            } else {
                console.log('Aucune piste suivante définie, vérification de la playlist personnalisée');
                const isCustomTabActive = this.playlistPopup.querySelector('.tab-btn[data-tab="custom"]').classList.contains('active');
                console.log('Onglet playlist personnalisée actif:', isCustomTabActive);
                console.log('Playlist personnalisée:', this.customPlaylist);
                
                if (isCustomTabActive && this.customPlaylist.length > 0) {
                    const currentTrackId = this.playlist[this.currentTrackIndex].id;
                    console.log('ID de la piste actuelle:', currentTrackId);
                    const currentCustomIndex = this.customPlaylist.indexOf(currentTrackId);
                    console.log('Index dans la playlist personnalisée:', currentCustomIndex);
                    
                    if (currentCustomIndex !== -1) {
                        console.log('Retrait de la piste de la playlist personnalisée');
                        this.customPlaylist.splice(currentCustomIndex, 1);
                        this.saveCustomPlaylist();
                    }
                    
                    let nextTrackId;
                    if (this.customPlaylist.length > 0) {
                        nextTrackId = this.customPlaylist[0];
                        console.log('Prochaine piste dans la playlist personnalisée:', nextTrackId);
                    } else {
                        console.log('Playlist personnalisée vide, passage à la playlist principale');
                        const nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
                        this.loadTrack(nextIndex);
                        if (this.isPlaying) {
                            this.audio.play().catch(error => {
                                console.log('Erreur de lecture:', error);
                            });
                        }
                        return;
                    }
                    
                    const nextIndex = this.playlist.findIndex(track => track.id === nextTrackId);
                    console.log('Index de la prochaine piste:', nextIndex);
                    
                    if (nextIndex !== -1) {
                        console.log('Chargement de la prochaine piste de la playlist personnalisée');
                        this.loadTrack(nextIndex);
                        if (this.isPlaying) {
                            console.log('Reprise de la lecture');
                            this.audio.play().catch(error => {
                                console.log('Erreur de lecture:', error);
                            });
                        }
                    }
                } else {
                    console.log('Utilisation de la playlist principale');
                    const nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
                    console.log('Prochain index:', nextIndex);
                    this.loadTrack(nextIndex);
                    if (this.isPlaying) {
                        console.log('Reprise de la lecture');
                        this.audio.play().catch(error => {
                            console.log('Erreur de lecture:', error);
                        });
                    }
                }
            }
        });
        this.settingsBtn.addEventListener('click', () => this.toggleVolumePopup());
    
        const volumeUp = this.volumePopup.querySelector('.volume-btn.up');
        const volumeDown = this.volumePopup.querySelector('.volume-btn.down');
    
        volumeUp.addEventListener('click', () => this.adjustVolume(0.1));
        volumeDown.addEventListener('click', () => this.adjustVolume(-0.1));
    
        const form = this.reviewPopup.querySelector('form');
        const cancelBtn = this.reviewPopup.querySelector('.cancel-btn');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReview();
        });
        
        cancelBtn.addEventListener('click', () => this.closeReviewPopup());
    
        this.reviewPopup.addEventListener('click', (e) => {
            if (e.target === this.reviewPopup) {
                this.closeReviewPopup();
            }
        });
    
        this.playlistBtn.addEventListener('click', () => this.togglePlaylistPopup());
        
        const closePlaylistBtn = this.playlistPopup.querySelector('.close-playlist');
        closePlaylistBtn.addEventListener('click', () => this.togglePlaylistPopup());
    
        const tabBtns = this.playlistPopup.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updatePlaylistDisplay(btn.dataset.tab);
            });
        });
    
        const progressBar = this.progressBar.querySelector('.progress-bar');
        let isSeeking = false;
        let seekPosition = 0;
        let lastTimeUpdate = 0;
    
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            console.log('Clic sur la barre de progression');
            console.log('Position relative:', pos);
            if (this.audio.duration) {
                const newTime = pos * this.audio.duration;
                console.log('Nouvelle position:', this.formatTime(newTime));
                
                const wasPlaying = !this.audio.paused;
                
                isSeeking = true;
                seekPosition = newTime;
                lastTimeUpdate = Date.now();
                
                this.audio.pause();
                
                this.progressBar.querySelector('.progress').style.width = `${pos * 100}%`;
                this.progressBar.querySelector('.current-time').textContent = this.formatTime(newTime);
                
                this.audio.currentTime = newTime;
            } else {
                console.log('Durée non disponible');
            }
        });
    
        this.audio.addEventListener('timeupdate', () => {
            if (this.audio.duration) {

                if (!isSeeking || Date.now() - lastTimeUpdate > 100) {
                    const progress = (this.audio.currentTime / this.audio.duration) * 100;
                    // console.log('Progression:', progress.toFixed(2) + '%');
                    // console.log('Temps actuel:', this.formatTime(this.audio.currentTime));
                    this.progressBar.querySelector('.progress').style.width = `${progress}%`;
                    this.progressBar.querySelector('.current-time').textContent = this.formatTime(this.audio.currentTime);
                }

                // Analytics: accumulate listened seconds and flush periodically
                try{
                    const now = this.audio.currentTime || 0;
                    if (this._lastTrackedTime == null) this._lastTrackedTime = now;
                    let delta = now - this._lastTrackedTime;
                    if (delta > 0 && delta < 30) {
                        this._accumulatedPlaySeconds = (this._accumulatedPlaySeconds || 0) + delta;
                        // if accumulated play for this continuous session reaches threshold, send webhook once
                        try{
                            if (!this._sent15ForCurrentPlay && (this._accumulatedPlaySeconds || 0) >= 15) {
                                this._sent15ForCurrentPlay = true;
                                const cur = this.playlist && this.playlist[this.currentTrackIndex];
                                if (cur) this.sendPlayThresholdWebhook(cur);
                            }
                        }catch(e){}
                        this._lastTrackedTime = now;
                    }

                    const nowMs = Date.now();
                    if (!this._lastAnalyticsFlushAt) this._lastAnalyticsFlushAt = nowMs;
                    if (nowMs - this._lastAnalyticsFlushAt >= 5000) {
                        const secs = Math.floor(this._accumulatedPlaySeconds || 0);
                        if (secs > 0 && this.playlist && this.playlist[this.currentTrackIndex]){
                            this.addPlayedSeconds(this.playlist[this.currentTrackIndex].id, secs);
                        }
                        this._accumulatedPlaySeconds = 0;
                        this._lastAnalyticsFlushAt = nowMs;
                    }
                }catch(e){/* ignore analytics errors */}
            }
        });
    
        this.audio.addEventListener('seeking', () => {
            console.log('Seeking en cours');
            isSeeking = true;
            lastTimeUpdate = Date.now();
        });
    
        this.audio.addEventListener('seeked', () => {
            console.log('Seeking terminé');
            isSeeking = false;
            if (this.isPlaying) {
                console.log('Reprise de la lecture après seeking');
                this.audio.play().catch(error => {
                    console.log('Erreur de lecture:', error);
                });
            }
        });
    
        this.audio.addEventListener('loadedmetadata', () => {
            console.log('Métadonnées chargées');
            console.log('Durée totale:', this.audio.duration);
            if (this.audio.duration) {
                this.progressBar.querySelector('.duration').textContent = this.formatTime(this.audio.duration);
                console.log('Durée affichée:', this.formatTime(this.audio.duration));
            }
        });

        // ensure any play (including programmatic ones like intro) is recorded once
        this.audio.addEventListener('play', () => {
            try{
                const cur = this.playlist && this.playlist[this.currentTrackIndex];
                if(cur) this.recordPlayStart(cur.id);
            }catch(e){}
        });
    
        this.audio.addEventListener('durationchange', () => {
            console.log('Changement de durée détecté');
            console.log('Nouvelle durée:', this.audio.duration);
            if (this.audio.duration) {
                this.progressBar.querySelector('.duration').textContent = this.formatTime(this.audio.duration);
                console.log('Durée mise à jour:', this.formatTime(this.audio.duration));
            }
        });
    
        this.audio.addEventListener('error', (e) => {
            console.log('Erreur de chargement audio:', e);
            console.log('Code d\'erreur:', this.audio.error.code);
            console.log('Message d\'erreur:', this.audio.error.message);
            this.progressBar.querySelector('.progress').style.width = '0%';
            this.progressBar.querySelector('.current-time').textContent = '0:00';
        });
    }

    toggleVolumePopup() {
        this.volumePopup.classList.toggle('active');
        this.settingsBtn.classList.toggle('active');
    }

    adjustVolume(change) {
        this.volume = Math.max(0, Math.min(1, this.volume + change));
        this.audio.volume = this.volume;
        this.volumePopup.querySelector('.volume-value').textContent = 
            `${Math.round(this.volume * 100)}%`;
    }

    loadTrack(index) {
        console.log('Chargement de la piste à l\'index:', index);
        if (index >= 0 && index < this.playlist.length) {
            const track = this.playlist[index];
            console.log('Piste à charger:', track);
            
            const wasPlaying = !this.audio.paused;
            
            // flush accumulated play seconds for the current track before switching
            try { this.flushAccumulated(); } catch(e){/* ignore */}
            console.log('Arrêt de la lecture actuelle');
            this.audio.pause();
            this.audio.currentTime = 0;
            
            this.progressBar.querySelector('.progress').style.width = '0%';
            this.progressBar.querySelector('.current-time').textContent = '0:00';
            this.progressBar.querySelector('.duration').textContent = '0:00';
            
            console.log('Changement de la source audio');
            this.audio.src = '../' + track.audioFile;
            this.titleElement.textContent = track.title;
            this.subtitleElement.textContent = track.instruments.join(', ');
            this.currentTrackIndex = index;
            // reset per-play flags
            this._accumulatedPlaySeconds = 0;
            this._lastTrackedTime = null;
            this._sent15ForCurrentPlay = false;
            
            if (wasPlaying) {
                this.audio.play().catch(error => {
                    console.log('Erreur de lecture:', error);
                });
            }
            
            console.log('Piste chargée avec succès');
        } else {
            console.log('Index invalide:', index);
        }
    }

    togglePlay() {
        if (this.audio.paused) {
            this.audio.play().catch(error => {
                console.log('Erreur de lecture:', error);
            });
            this.isPlaying = true;
            this.playBtn.src = 'icon/pause.svg';
            document.querySelector('.control-btn.play').classList.add('playing');
        } else {
            this.audio.pause();
            this.isPlaying = false;
            this.playBtn.src = 'icon/play.svg';
            document.querySelector('.control-btn.play').classList.remove('playing');
        }
    }

    playRandom() {
        const randomIndex = Math.floor(Math.random() * this.playlist.length);
        this.loadTrack(randomIndex);
        if (this.isPlaying) {
            this.audio.play();
        }
        this.shuffleBtn.classList.add('active');
        setTimeout(() => this.shuffleBtn.classList.remove('active'), 300);
    }

    playNext() {
        console.log('Méthode playNext appelée');
        let nextIndex;
        const isCustomTabActive = this.playlistPopup.querySelector('.tab-btn[data-tab="custom"]').classList.contains('active');
        console.log('Onglet playlist personnalisée actif:', isCustomTabActive);

        if (isCustomTabActive && this.customPlaylist.length > 0) {
            console.log('Utilisation de la playlist personnalisée');
            const currentTrackId = this.playlist[this.currentTrackIndex].id;
            console.log('ID de la piste actuelle:', currentTrackId);
            const currentCustomIndex = this.customPlaylist.indexOf(currentTrackId);
            console.log('Index dans la playlist personnalisée:', currentCustomIndex);
            
            if (currentCustomIndex !== -1) {
                const nextCustomIndex = (currentCustomIndex + 1) % this.customPlaylist.length;
                const nextTrackId = this.customPlaylist[nextCustomIndex];
                console.log('Prochaine piste dans la playlist personnalisée:', nextTrackId);
                nextIndex = this.playlist.findIndex(track => track.id === nextTrackId);
                console.log('Index de la prochaine piste:', nextIndex);
            }
        } else {
            console.log('Utilisation de la playlist principale');
            nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
            console.log('Prochain index:', nextIndex);
        }

        if (nextIndex !== undefined && nextIndex !== -1) {
            console.log('Chargement de la prochaine piste');
            this.loadTrack(nextIndex);
            if (this.isPlaying) {
                console.log('Reprise de la lecture');
                this.audio.play().catch(error => {
                    console.log('Erreur de lecture:', error);
                });
            }
        } else {
            console.log('Impossible de trouver la prochaine piste');
        }
    }

    playPrevious() {
        let prevIndex = this.currentTrackIndex - 1;
        if (prevIndex < 0) {
            prevIndex = this.playlist.length - 1;
        }
        this.loadTrack(prevIndex);
        if (this.isPlaying) {
            this.audio.play().catch(error => {
                console.log('Erreur de lecture:', error);
            });
        }
    }

    handleReviewSystem() {
        const currentTrack = this.playlist[this.currentTrackIndex];
        this.favoriteBtn.classList.add('liked');
        
        if (this.reviews[currentTrack.id]) {
            this.showReviews();
        } else {
            this.openReviewPopup();
        }

        setTimeout(() => {
            this.favoriteBtn.classList.remove('liked');
        }, 800);
    }

    openReviewPopup() {
        this.reviewPopup.classList.add('active');
        this.reviewPopup.querySelector('textarea').value = '';
    }

    closeReviewPopup() {
        this.reviewPopup.classList.remove('active');
    }

    async submitReview() {
        const currentTrack = this.playlist[this.currentTrackIndex];
        const form = this.reviewPopup.querySelector('form');
        const reviewText = form.querySelector('textarea').value.trim();
        
        if (reviewText) {
            try {
                const formData = new FormData(form);
                formData.append('track-title', currentTrack.title);
                formData.append('track-id', currentTrack.id);
                
                await fetch('/', {
                    method: 'POST',
                    body: formData
                });
                
                if (!this.reviews[currentTrack.id]) {
                    this.reviews[currentTrack.id] = [];
                }
                
                this.reviews[currentTrack.id].push({
                    text: reviewText,
                    date: new Date().toLocaleDateString(),
                    trackTitle: currentTrack.title
                });
                
                this.saveReviewsToStorage();
                this.closeReviewPopup();
                this.showReviews();
                
                form.reset();
            } catch (error) {
                console.error('Erreur lors de l\'envoi du formulaire:', error);
                alert('Une erreur est survenue lors de l\'envoi de votre avis. Veuillez réessayer.');
            }
        }
    }

    showReviews() {
        const currentTrack = this.playlist[this.currentTrackIndex];
        let reviewsList = document.querySelector('.reviews-list');
        
        if (!reviewsList) {
            reviewsList = document.createElement('div');
            reviewsList.className = 'reviews-list';
            document.querySelector('.player-container').appendChild(reviewsList);
        }

        const reviews = this.reviews[currentTrack.id] || [];
        reviewsList.innerHTML = `
            <div class="reviews-header">
                <h3>Avis pour "${currentTrack.title}"</h3>
                <div class="reviews-actions">
                    <button class="export-reviews">Exporter</button>
                    <button class="close-reviews">×</button>
                </div>
            </div>
            ${reviews.length > 0 ? reviews.map(review => `
                <div class="review-item">
                    <div class="review-date">${review.date}</div>
                    <div class="review-text">${review.text}</div>
                </div>
            `).join('') : '<div class="no-reviews">Aucun avis pour le moment</div>'}
        `;

        reviewsList.classList.add('active');

        const closeBtn = reviewsList.querySelector('.close-reviews');
        const exportBtn = reviewsList.querySelector('.export-reviews');

        closeBtn.addEventListener('click', () => {
            reviewsList.classList.remove('active');
        });

        exportBtn.addEventListener('click', () => {
            this.exportReviews();
        });

        const style = document.createElement('style');
        style.textContent = `
            .reviews-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid rgba(180, 122, 255, 0.2);
            }

            .reviews-actions {
                display: flex;
                gap: 1rem;
                align-items: center;
            }

            .export-reviews {
                background: rgba(180, 122, 255, 0.2);
                border: 1px solid #B47AFF;
                color: #B47AFF;
                padding: 0.3rem 0.8rem;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.2s;
            }

            .export-reviews:hover {
                background: rgba(180, 122, 255, 0.3);
                transform: scale(1.05);
            }

            .close-reviews {
                background: none;
                border: none;
                color: #B47AFF;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.2rem 0.5rem;
                transition: transform 0.2s;
            }

            .close-reviews:hover {
                transform: scale(1.1);
            }

            .no-reviews {
                color: rgba(255, 255, 255, 0.7);
                text-align: center;
                padding: 1rem;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    }

    exportReviews() {
        const dataStr = JSON.stringify(this.reviews, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'avis-musique.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    togglePlaylistPopup() {
        this.playlistPopup.classList.toggle('active');
        if (this.playlistPopup.classList.contains('active')) {
            const activeTab = this.playlistPopup.querySelector('.tab-btn.active');
            if (activeTab) {
                this.updatePlaylistDisplay(activeTab.dataset.tab);
            } else {
                this.updatePlaylistDisplay('all');
            }
        }
    }

    updatePlaylistDisplay(tab = 'all') {
        const playlistList = this.playlistPopup.querySelector('.playlist-list');
        let tracks;
        
        if (tab === 'all') {
            tracks = this.playlist;
        } else {
            tracks = this.customPlaylist.map(id => 
                this.playlist.find(track => track.id === id)
            ).filter(track => track !== undefined);
        }
        
        playlistList.innerHTML = tracks.map(track => `
            <div class="playlist-item ${track.id === this.playlist[this.currentTrackIndex].id ? 'active' : ''} ${this.customPlaylist.includes(track.id) ? 'selected' : ''}">
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${track.title}</div>
                    <div class="playlist-item-instruments">${track.instruments.join(', ')}</div>
                </div>
                <div class="playlist-item-actions">
                    ${tab === 'all' ? `
                        <button class="add-to-playlist" title="Ajouter à ma playlist">+</button>
                    ` : `
                        <button class="remove-from-playlist" title="Retirer de ma playlist">×</button>
                    `}
                    <button class="set-next" title="Jouer ensuite">▶</button>
                </div>
            </div>
        `).join('');

        playlistList.querySelectorAll('.add-to-playlist').forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackId = tracks[index].id;
                if (!this.customPlaylist.includes(trackId)) {
                    this.customPlaylist.push(trackId);
                    this.saveCustomPlaylist();
                    // notify server about added track (send track info + timestamp)
                    try{
                        const t = this.playlist.find(tr => tr.id === trackId) || {id:trackId,title:'unknown',audioFile:''};
                        const payload = {event:'added_to_playlist',ts:new Date().toISOString(),deviceId:this.deviceId,trackId:t.id,title:t.title,audioFile:t.audioFile,platform:this.detectPlatform(),ua:navigator.userAgent||'',clientIp:this.clientIp||'unknown'};
                        // prefer server-side collect
                        if (this.serverCollectEnabled) fetch('/api/collect',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{ this.sendToWebhook(JSON.stringify(payload)); });
                        else this.sendToWebhook(JSON.stringify(payload));
                    }catch(e){}
                    this.updatePlaylistDisplay(tab);
                }
            });
        });

        playlistList.querySelectorAll('.remove-from-playlist').forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackId = tracks[index].id;
                this.customPlaylist = this.customPlaylist.filter(id => id !== trackId);
                this.saveCustomPlaylist();
                this.updatePlaylistDisplay(tab);
            });
        });

        playlistList.querySelectorAll('.set-next').forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextTrackId = tracks[index].id;
                this.updatePlaylistDisplay(tab);
            });
        });

        playlistList.querySelectorAll('.playlist-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.loadTrack(this.playlist.findIndex(track => track.id === tracks[index].id));
                if (this.isPlaying) {
                    this.audio.play();
                }
                this.togglePlaylistPopup();
            });
        });
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    createIntroPopup() {
        const introPopup = document.createElement('div');
        introPopup.className = 'intro-popup';
            introPopup.innerHTML = `
            <div class="intro-content">
                <h3>Découvrir la sélection spéciale</h3>
                <p>Voulez-vous écouter le dernier morceau publié, <strong>Take me to Church - Guitar</strong> (track30) ?</p>
                <ul>
                    <li>Take me to Church - Hozier</li>
                </ul>
                <p class="intro-note" style="font-size:0.9rem; color:#f0e6ff; margin-top:0.6rem;">Les commentaires vous pouvez en mettre mais je les reçois une fois sur deux donc pas fou faut je chnge ça mais flemme là</p>
                <div class="intro-actions">
                    <button class="intro-cancel">Non merci</button>
                    <button class="intro-play">Écouter la sélection</button>
                </div>
            </div>
        `;
        document.querySelector('.player-container').appendChild(introPopup);

        const style = document.createElement('style');
        style.textContent = `
            .intro-popup {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(8, 7, 27, 0.85);
                display: flex; justify-content: center; align-items: center;
                z-index: 3000;
                backdrop-filter: blur(7px);
                animation: introFadeIn 0.5s cubic-bezier(.4,2,.6,1) both;
            }
            @keyframes introFadeIn {
                0% { opacity: 0; transform: scale(0.95); }
                100% { opacity: 1; transform: scale(1); }
            }
            .intro-content {
                background: linear-gradient(135deg, rgba(36, 0, 70, 0.98) 0%, rgba(180, 122, 255, 0.97) 100%);
                border-radius: 28px;
                padding: 2.5rem 1.7rem 2rem 1.7rem;
                max-width: 370px;
                width: 92vw;
                color: #fff;
                border: 1.5px solid rgba(180, 122, 255, 0.35);
                text-align: center;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                position: relative;
                overflow: hidden;
            }
            .intro-content::before {
                content: '';
                position: absolute;
                top: -60px; left: -60px;
                width: 120px; height: 120px;
                background: radial-gradient(circle, #b47aff55 0%, transparent 80%);
                z-index: 0;
            }
            .intro-content h3 {
                color: #fff;
                margin-bottom: 1.2rem;
                font-size: 1.45rem;
                letter-spacing: 0.5px;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }
            .intro-content h3::before {
                content: '\u{1F3B5}'; /* note de musique */
                font-size: 1.5em;
                display: inline-block;
                margin-right: 0.2em;
                filter: drop-shadow(0 0 2px #b47aff);
            }
            .intro-content p {
                margin-bottom: 1.1rem;
                font-size: 1.08rem;
                color: #e0d6f7;
            }
            .intro-content ul {
                text-align: left;
                margin: 1.1rem 0 1.5rem 0;
                padding-left: 1.2rem;
                color: #fff;
                font-size: 1.01rem;
                font-weight: 500;
                list-style: disc inside;
            }
            .intro-content ul li {
                margin-bottom: 0.4rem;
                padding-left: 0.2rem;
                text-shadow: 0 1px 2px #0002;
            }
            .intro-actions {
                display: flex;
                justify-content: center;
                gap: 1.2rem;
                margin-top: 1.7rem;
                z-index: 1;
            }
            .intro-actions button {
                padding: 0.7rem 1.5rem;
                border-radius: 12px;
                border: none;
                cursor: pointer;
                font-size: 1.08rem;
                font-weight: 600;
                box-shadow: 0 2px 8px 0 rgba(180,122,255,0.10);
                transition: all 0.18s cubic-bezier(.4,2,.6,1);
                outline: none;
            }
            .intro-cancel {
                background: rgba(255,255,255,0.13);
                color: #B47AFF;
                border: 1.5px solid #B47AFF;
            }
            .intro-play {
                background: linear-gradient(90deg, #B47AFF 0%, #DB00EC 100%);
                color: #fff;
                border: none;
                box-shadow: 0 2px 12px 0 #b47aff44;
                position: relative;
            }
            .intro-play::after {
                content: '\u25B6';
                font-size: 1.1em;
                margin-left: 0.5em;
                vertical-align: middle;
            }
            .intro-actions button:hover, .intro-actions button:focus {
                transform: scale(1.07) translateY(-2px);
                box-shadow: 0 4px 16px 0 #b47aff55;
            }
        `;
        document.head.appendChild(style);

        const closePopup = () => {
            introPopup.remove();
        };
        introPopup.querySelector('.intro-cancel').addEventListener('click', closePopup);
        introPopup.querySelector('.intro-play').addEventListener('click', () => {
            closePopup();
            this.playIntroTracks();
        });
    }

    playIntroTracks() {
        if (!this.playlist || this.playlist.length === 0) {
            setTimeout(() => this.playIntroTracks(), 200);
            return;
        }

        const promotedId = this.introTracks[0];

        let index = this.playlist.findIndex(track => track.id === promotedId);

        if (index === -1) {
            const newTrack = {
                id: promotedId,
                title: 'Take me to church - Guitar',
                instruments: ['guitare'],
                audioFile: 'sons/takemetochurch.mp3'
            };
            this.playlist.push(newTrack);
            this.originalPlaylist = [...this.playlist];
            index = this.playlist.length - 1;
        }

        this.loadTrack(index);
        this.audio.play().catch(error => {
            console.log('Erreur de lecture intro:', error);
        });
        this.isPlaying = true;
        this.playBtn.src = 'icon/pause.svg';
        document.querySelector('.control-btn.play').classList.add('playing');
    }

    /* ---------------- Analytics / instrumentation ---------------- */
    initAnalytics() {
        try {
            this.analytics = JSON.parse(localStorage.getItem('musicAnalytics') || '{}');
        } catch (e) {
            this.analytics = {};
        }
        if (!this.analytics.devices) this.analytics.devices = this.analytics.devices || {};
        if (!this.analytics.plays) this.analytics.plays = this.analytics.plays || {};
        if (!this.analytics.likes) this.analytics.likes = this.analytics.likes || {};
        if (!this.analytics.deviceId) {
            this.analytics.deviceId = this.generateDeviceId();
            this.saveAnalytics();
        }
        this.deviceId = this.analytics.deviceId;
        // detect if we should try sending to /api/collect (skip on simple local static server)
        try{
            const host = (location && location.hostname) || '';
            this.serverCollectEnabled = !(host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:');
        }catch(e){ this.serverCollectEnabled = false; }
        // store basic device info (ua/browser/platform)
        try{
            const ua = navigator.userAgent || '';
            let browser = ua;
            try{
                if(navigator.userAgentData && navigator.userAgentData.brands){
                    browser = navigator.userAgentData.brands.map(b=>b.brand+' '+b.version).join(', ');
                }
            }catch(e){}
            const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || (/Android/.test(ua) ? 'Android' : (/iPhone|iPad|iPod/.test(ua) ? 'iOS' : (/Macintosh|Mac OS X/.test(ua) ? 'Mac' : (/Windows/.test(ua) ? 'Windows' : 'Other'))));
            this.analytics.devices = this.analytics.devices || {};
            this.analytics.devices[this.deviceId] = Object.assign(this.analytics.devices[this.deviceId] || {}, {lastSeen: new Date().toISOString(), ua: ua, browser: browser, platform: platform});
            this.saveAnalytics();
        }catch(e){}
        this._lastTrackedTime = null;
        this._accumulatedPlaySeconds = 0;
        this._lastAnalyticsFlushAt = Date.now();
        // try to resolve public IP once (fallback to 'local') and then notify arrival
        try{
            // try multiple IP services for better chance to resolve
            const tryIps = async () => {
                const services = [
                    'https://api.ipify.org?format=json',
                    'https://ifconfig.co/json',
                    'https://ipinfo.io/json?token='];// ipinfo token optional
                for (const url of services) {
                    try{
                        const r = await fetch(url, {cache:'no-store'});
                        if (!r.ok) continue;
                        const j = await r.json();
                        const ip = j && (j.ip || j.ip_address || j.client_ip || j.hostname) ? (j.ip || j.ip_address || j.client_ip || j.hostname) : null;
                        if (ip) { this.clientIp = ip; return; }
                    }catch(e){}
                }
                this.clientIp = 'local';
            };
            tryIps().then(()=>{ try{ this.sendArrivalWebhook(); }catch(e){} }).catch(()=>{ this.clientIp='local'; try{ this.sendArrivalWebhook(); }catch(e){} });
        }catch(e){ this.clientIp = 'local'; try{ this.sendArrivalWebhook(); }catch(e){} }
    }

    saveAnalytics() {
        try {
            localStorage.setItem('musicAnalytics', JSON.stringify(this.analytics));
        } catch (e) { }
    }

    generateDeviceId() {
        return 'dev_' + Math.random().toString(36).slice(2, 10);
    }

    detectPlatform() {
        try{
            const ua = navigator.userAgent || '';
            if (navigator.userAgentData && navigator.userAgentData.platform) return navigator.userAgentData.platform;
            if (navigator.platform) return navigator.platform;
            if (/Android/.test(ua)) return 'Android';
            if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
            if (/Macintosh|Mac OS X/.test(ua)) return 'Mac';
            if (/Windows/.test(ua)) return 'Windows';
            return 'Other';
        }catch(e){ return 'Unknown'; }
    }

    async sendToWebhook(payload) {
        // Prefer server-side forwarding to avoid CORS issues: try /api/collect first
        try{
            if (this.serverCollectEnabled) {
                const res = await fetch('/api/collect', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({forwardToDiscord:true,payload:payload,ts:new Date().toISOString(),deviceId:this.deviceId})});
                if (res && res.ok) return true;
            }
        }catch(e){ console.log('/api/collect forward failed', e); }

        // fallback: try direct webhook (may fail due to CORS)
        try{
            if (!this.webhookUrl) return false;
            const res = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: payload })
            });
            if (res && res.ok) return true;
        }catch(e){ console.log('Direct webhook send error', e); }

        // store pending for retry
        try{
            const pending = JSON.parse(localStorage.getItem('pendingWebhookEvents')||'[]');
            pending.push({payload,ts:new Date().toISOString(),deviceId:this.deviceId});
            localStorage.setItem('pendingWebhookEvents', JSON.stringify(pending));
            this.schedulePendingRetry();
        }catch(e3){ console.log('Storing pending webhook failed', e3); }
        return false;
    }

    schedulePendingRetry() {
        if (this._pendingRetryScheduled) return;
        this._pendingRetryScheduled = true;
        const tryOnce = async () => {
            try{
                const pending = JSON.parse(localStorage.getItem('pendingWebhookEvents')||'[]');
                if (!pending || pending.length === 0) { this._pendingRetryScheduled = false; return; }
                const remaining = [];
                for (const ev of pending) {
                    try{
                        // attempt direct webhook
                        const res = await fetch(this.webhookUrl, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content: ev.payload})});
                        if (res.ok) continue; // sent
                        // else, try server collect
                        if (this.serverCollectEnabled) {
                            await fetch('/api/collect', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.assign({type:'webhook_forward'}, ev))});
                            continue;
                        }
                        remaining.push(ev);
                    }catch(e){ remaining.push(ev); }
                }
                localStorage.setItem('pendingWebhookEvents', JSON.stringify(remaining));
                if (remaining.length > 0) setTimeout(tryOnce, 30000); else this._pendingRetryScheduled = false;
            }catch(e){ console.log('pending retry error', e); this._pendingRetryScheduled = false; }
        };
        setTimeout(tryOnce, 5000);
    }

    sendArrivalWebhook() {
        try{
            const info = {
                event: 'arrival',
                ts: new Date().toISOString(),
                deviceId: this.deviceId,
                platform: this.detectPlatform(),
                ua: navigator.userAgent || '',
                clientIp: this.clientIp || 'unknown',
                url: location && location.href ? location.href : ''
            };
            const content = `New visitor: ${JSON.stringify(info, null, 0)}`;
            this.sendToWebhook(content);
        }catch(e){/* ignore */}
    }

    sendPlayThresholdWebhook(track) {
        try{
            const info = {
                event: 'played_>15s',
                ts: new Date().toISOString(),
                deviceId: this.deviceId,
                platform: this.detectPlatform(),
                ua: navigator.userAgent || '',
                clientIp: this.clientIp || 'unknown',
                trackId: track.id,
                title: track.title,
                audioFile: track.audioFile,
                url: location && location.href ? location.href : ''
            };
            const content = `Played >15s: ${JSON.stringify(info, null, 0)}`;
            this.sendToWebhook(content);
        }catch(e){/* ignore */}
    }

    recordPlayStart(trackId){
        try{
            if(!trackId) return;
            this.analytics.plays = this.analytics.plays || {};
            const a = this.analytics.plays[trackId] = this.analytics.plays[trackId] || {count:0,totalTimeSeconds:0,devices:{}};
            a.count = (a.count||0) + 1;
            a.devices = a.devices || {};
            a.devices[this.deviceId] = a.devices[this.deviceId] || {count:0,totalTimeSeconds:0};
            a.devices[this.deviceId].count = (a.devices[this.deviceId].count||0) + 1;
            this.analytics.devices = this.analytics.devices || {};
            const platform = this.detectPlatform();
            this.analytics.devices[this.deviceId] = Object.assign(this.analytics.devices[this.deviceId] || {}, {lastSeen: new Date().toISOString(), platform: platform, ua: navigator.userAgent||''});
            this.saveAnalytics();
            // try to send to serverless endpoint (only when enabled)
            const payload = {type:'play_start',trackId,deviceId:this.deviceId,ts:new Date().toISOString(), ua: navigator.userAgent||'', platform: platform};
            if(this.serverCollectEnabled){
                try{ fetch('/api/collect', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{}); }catch(e){}
            } else {
                // store locally for admin when no server endpoint available
                try{
                    const ev = JSON.parse(localStorage.getItem('collectedEvents')||'[]');
                    ev.push(Object.assign({ip: this.clientIp || 'local'}, payload));
                    localStorage.setItem('collectedEvents', JSON.stringify(ev));
                }catch(e){}
            }
        }catch(e){}
    }

    addPlayedSeconds(trackId, seconds){
        try{
            if(!trackId || !seconds) return;
            seconds = Math.max(0, Math.round(seconds));
            this.analytics.plays = this.analytics.plays || {};
            const a = this.analytics.plays[trackId] = this.analytics.plays[trackId] || {count:0,totalTimeSeconds:0,devices:{}};
            a.totalTimeSeconds = (a.totalTimeSeconds||0) + seconds;
            a.devices = a.devices || {};
            a.devices[this.deviceId] = a.devices[this.deviceId] || {count:0,totalTimeSeconds:0};
            a.devices[this.deviceId].totalTimeSeconds = (a.devices[this.deviceId].totalTimeSeconds||0) + seconds;
            this.analytics.devices = this.analytics.devices || {};
            this.analytics.devices[this.deviceId] = this.analytics.devices[this.deviceId] || {lastSeen: new Date().toISOString()};
            this.saveAnalytics();
            const payload = {type:'play_time',trackId,seconds,deviceId:this.deviceId,ts:new Date().toISOString(), ua: navigator.userAgent||''};
            if(this.serverCollectEnabled){ try{ fetch('/api/collect', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{}); }catch(e){} }
            else { try{ const ev = JSON.parse(localStorage.getItem('collectedEvents')||'[]'); ev.push(Object.assign({ip: this.clientIp || 'local'}, payload)); localStorage.setItem('collectedEvents', JSON.stringify(ev)); }catch(e){} }
        }catch(e){}
    }

    recordLike(trackId){
        try{
            if(!trackId) return;
            this.analytics.likes = this.analytics.likes || {};
            this.analytics.likes[trackId] = (this.analytics.likes[trackId]||0) + 1;
            this.saveAnalytics();
            if(this.serverCollectEnabled){ try{ fetch('/api/collect', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'like',trackId,deviceId:this.deviceId,ts:new Date().toISOString()})}).catch(()=>{}); }catch(e){} }
        }catch(e){}
    }

    flushAccumulated(){
        try{
            const secs = Math.floor(this._accumulatedPlaySeconds || 0);
            if (secs > 0 && this.playlist && this.playlist[this.currentTrackIndex]){
                this.addPlayedSeconds(this.playlist[this.currentTrackIndex].id, secs);
            }
            this._accumulatedPlaySeconds = 0;
            this._lastTrackedTime = null;
        }catch(e){}
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const player = new MusicPlayer();
}); 