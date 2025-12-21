console.log('Script.js loaded!');

// Music data
const songs = [
    {
        title: "Chinmoku no Majo",
        artist: "Yoshihisa Kato",
        src: "lagu/song1.mp3",
        cover: "gambar/song1.jpg"
    },
    {
        title: "Mizlecca",
        artist: "Hagali",
        src: "lagu/song2.mp3",
        cover: "gambar/song2.jpeg"
    },
    {
        title: "Fig Luudhran",
        artist: "Hagali",
        src: "lagu/song3.mp3",
        cover: "gambar/song3.jpg"
    },
    {
        title: "Ebari and The Forest",
        artist: "Hagali",
        src: "lagu/song4.mp3",
        cover: "gambar/song4.jpg"
    }
];

// Global variables
let currentIndex = 0;
let isPlaying = false;
let repeatMode = 'off';
let audioEnabled = false;

// DOM Elements
const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const repeatBtn = document.getElementById('repeat-btn');
const repeatText = document.getElementById('repeat-text');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const titleEl = document.getElementById('title');
const artistEl = document.getElementById('artist');
const coverEl = document.getElementById('cover');
const playlistItems = document.getElementById('playlist-items');

// Format time
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Enable audio for mobile
async function enableAudio() {
    if (audioEnabled) return true;
    
    console.log('Enabling audio...');
    try {
        audio.volume = 0.01;
        await audio.play();
        await audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
        audioEnabled = true;
        console.log('Audio enabled successfully');
        return true;
    } catch (error) {
        console.log('Audio enable failed:', error.message);
        return false;
    }
}

// Load song
async function loadSong(index, autoPlay = false) {
    console.log(`loadSong: index=${index}, autoPlay=${autoPlay}`);
    
    // Validate index
    if (index < 0) index = songs.length - 1;
    if (index >= songs.length) index = 0;
    
    currentIndex = index;
    const song = songs[index];
    
    console.log('Loading song:', song.title);
    
    // Update UI
    titleEl.textContent = song.title;
    artistEl.textContent = song.artist;
    coverEl.src = song.cover;
    
    // Store if was playing
    const wasPlaying = !audio.paused;
    
    // Stop current audio
    if (!audio.paused) {
        audio.pause();
    }
    
    // Set new audio source
    audio.src = song.src;
    
    // Reset progress
    progressBar.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    
    // Load new audio
    audio.load();
    
    // Update playlist
    updatePlaylistUI();
    
    // Auto-play if requested
    if (autoPlay && wasPlaying) {
        console.log('Attempting auto-play after song change');
        // Wait a bit for audio to load
        setTimeout(() => {
            playSong().catch(console.error);
        }, 300);
    }
}

// Play song with error handling
async function playSong() {
    console.log('playSong called, audioEnabled:', audioEnabled);
    
    try {
        if (!audioEnabled) {
            const enabled = await enableAudio();
            if (!enabled) {
                console.log('Cannot play: audio not enabled');
                return;
            }
        }
        
        await audio.play();
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        isPlaying = true;
        console.log('Playback started');
    } catch (error) {
        console.error('Play failed:', error);
        
        // If autoplay blocked, show play button
        if (error.name === 'NotAllowedError') {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
            
            // Enable audio for next attempt
            audio.volume = 0.01;
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
                audio.volume = 1;
                audioEnabled = true;
                console.log('Audio enabled via error recovery');
            }).catch(() => {});
        }
    }
}

// Toggle play/pause
async function togglePlay() {
    console.log('togglePlay called, audio.paused:', audio.paused);
    
    if (audio.paused) {
        await playSong();
    } else {
        audio.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
    }
}

// Next song
function nextSong() {
    console.log('nextSong called');
    const wasPlaying = !audio.paused;
    loadSong(currentIndex + 1, wasPlaying);
}

// Previous song
function prevSong() {
    console.log('prevSong called');
    
    // If more than 3 seconds played, restart current song
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }
    
    const wasPlaying = !audio.paused;
    loadSong(currentIndex - 1, wasPlaying);
}

// Toggle repeat
function toggleRepeat() {
    console.log('toggleRepeat called');
    repeatMode = repeatMode === 'off' ? 'on' : 'off';
    repeatText.textContent = `Repeat: ${repeatMode === 'on' ? 'On' : 'Off'}`;
    repeatBtn.classList.toggle('active', repeatMode === 'on');
}

// Update progress
function updateProgress() {
    if (!audio.duration || isNaN(audio.duration)) return;
    
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${progress}%`;
    currentTimeEl.textContent = formatTime(audio.currentTime);
}

// Seek in song
function seek(e) {
    if (!audio.duration || isNaN(audio.duration)) return;
    
    const rect = this.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / this.clientWidth;
    
    audio.currentTime = percent * audio.duration;
}

// Update duration
function updateDuration() {
    if (!audio.duration || isNaN(audio.duration)) return;
    durationEl.textContent = formatTime(audio.duration);
}

// Handle song end - FIXED AUTO-PLAY
async function handleSongEnd() {
    console.log('Song ended, repeatMode:', repeatMode);
    
    if (repeatMode === 'on') {
        // Repeat current song
        audio.currentTime = 0;
        setTimeout(() => {
            playSong().catch(console.error);
        }, 100);
    } else {
        // Auto-play next song with delay
        console.log('Auto-playing next song...');
        const nextIndex = (currentIndex + 1) % songs.length;
        currentIndex = nextIndex;
        const song = songs[nextIndex];
        
        // Update UI first
        titleEl.textContent = song.title;
        artistEl.textContent = song.artist;
        coverEl.src = song.cover;
        updatePlaylistUI();
        
        // Stop current audio
        audio.pause();
        
        // Set new audio source
        audio.src = song.src;
        audio.load();
        
        // Wait for audio to load, then try to play
        setTimeout(async () => {
            try {
                await audio.play();
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                isPlaying = true;
                console.log('Auto-play successful!');
            } catch (error) {
                console.log('Auto-play blocked, user must click:', error.message);
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                isPlaying = false;
            }
        }, 500);
    }
}

// Render playlist
function renderPlaylist() {
    console.log('Rendering playlist with', songs.length, 'songs');
    
    playlistItems.innerHTML = '';
    
    songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = `playlist-item ${index === currentIndex ? 'active' : ''}`;
        item.innerHTML = `
            <img src="${song.cover}" alt="${song.title}" 
            <div class="playlist-info">
                <div class="playlist-title">${song.title}</div>
                <div class="playlist-artist">${song.artist}</div>
            </div>
        `;

        item.querySelector('img').onerror = function() {
            this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23f5f5f5"/><text x="20" y="22" text-anchor="middle" font-size="12" fill="%23999">🎵</text></svg>';
            this.alt = 'No cover image';
        };
        
        item.addEventListener('click', () => {
            console.log('Playlist item clicked:', index);
            const wasPlaying = !audio.paused;
            loadSong(index, wasPlaying);
        });
        
        playlistItems.appendChild(item);
    });
    
    console.log('Playlist rendered');
}

// Update playlist UI
function updatePlaylistUI() {
    const items = document.querySelectorAll('.playlist-item');
    items.forEach((item, index) => {
        item.classList.toggle('active', index === currentIndex);
    });
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Player controls
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    repeatBtn.addEventListener('click', toggleRepeat);
    
    // Progress bar click
    progressContainer.addEventListener('click', seek);
    
    // Audio events
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleSongEnd);
    
    audio.addEventListener('play', () => {
        console.log('Audio play event');
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        isPlaying = true;
    });
    
    audio.addEventListener('pause', () => {
        console.log('Audio pause event');
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
    });
    
    // Error handling for audio loading
    audio.addEventListener('error', (e) => {
        console.error('Audio error:', audio.error);
        console.error('Audio src:', audio.src);
        
        // Try next song if current fails
        if (audio.error && audio.error.code === 4) {
            console.log('Media not found, trying next song in 2 seconds...');
            setTimeout(() => {
                const nextIndex = (currentIndex + 1) % songs.length;
                loadSong(nextIndex, isPlaying);
            }, 2000);
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
            case ' ':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextSong();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                prevSong();
                break;
            case 'r':
            case 'R':
                if (e.ctrlKey) {
                    e.preventDefault();
                    toggleRepeat();
                }
                break;
        }
    });
    
    // Enable audio on first click (for mobile)
    document.addEventListener('click', function enableAudioOnce() {
        console.log('First click detected, enabling audio...');
        enableAudio();
    }, { once: true });
    
    // Also enable on touch for mobile
    document.addEventListener('touchstart', function enableAudioOnceTouch() {
        console.log('First touch detected, enabling audio...');
        enableAudio();
        document.removeEventListener('touchstart', enableAudioOnceTouch);
    }, { once: true });
    
    console.log('Event listeners setup complete');
}

// Initialize
function init() {
    console.log('=== Initializing Music Player ===');
    
    // Set initial volume
    audio.volume = 1;
    
    // Load first song
    loadSong(0);
    
    // Render playlist
    renderPlaylist();
    
    // Setup event listeners
    setupEventListeners();
    
    // Test audio files
    testAudioFiles();
    
    console.log('=== Music Player Ready! ===');
}

// Test if audio files exist
function testAudioFiles() {
    console.log('Testing audio files...');
    songs.forEach((song, index) => {
        fetch(song.src, { method: 'HEAD' })
            .then(res => {
                console.log(`✓ Audio ${index + 1}: "${song.title}" - ${res.status} OK`);
            })
            .catch(err => {
                console.error(`✗ Audio ${index + 1}: "${song.title}" - NOT FOUND`);
                console.error(`  Path: ${song.src}`);
            });
    });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Log for debugging
window.playerDebug = {
    songs: songs,
    currentIndex: () => currentIndex,
    isPlaying: () => isPlaying,
    repeatMode: () => repeatMode,
    audioEnabled: () => audioEnabled,
    playCurrentSong: () => playSong()
};

console.log('Player debug object available: window.playerDebug');
