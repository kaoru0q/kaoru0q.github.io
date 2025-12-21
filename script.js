// Music data from your folders
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

// Player State
let currentIndex = 0;
let isPlaying = false;
let repeatMode = 'off'; // 'off', 'on'

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

// Format time (seconds to MM:SS)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Load song
function loadSong(index) {
    if (index < 0) index = songs.length - 1;
    if (index >= songs.length) index = 0;
    
    currentIndex = index;
    const song = songs[index];
    
    // Update UI
    titleEl.textContent = song.title;
    artistEl.textContent = song.artist;
    coverEl.src = song.cover;
    
    // Set audio source
    audio.src = song.src;
    audio.load();
    
    // Update active playlist item
    updatePlaylistUI();
    
    console.log('Loaded:', song.title);
}

// Play/Pause
async function togglePlay() {
    try {
        if (audio.paused) {
            await audio.play();
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            isPlaying = true;
        } else {
            audio.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
        }
    } catch (error) {
        console.log('Play error:', error);
        // Try to enable audio on mobile
        if (error.name === 'NotAllowedError') {
            enableAudio();
        }
    }
}

// Enable audio for mobile
function enableAudio() {
    audio.volume = 0.01;
    audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
        console.log('Audio enabled for mobile');
    }).catch(() => {
        console.log('Audio enable failed');
    });
}

// Next song
function nextSong() {
    loadSong(currentIndex + 1);
    if (isPlaying) {
        audio.play().catch(console.error);
    }
}

// Previous song
function prevSong() {
    // If less than 3 seconds played, go to previous song
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }
    loadSong(currentIndex - 1);
    if (isPlaying) {
        audio.play().catch(console.error);
    }
}

// Toggle repeat
function toggleRepeat() {
    repeatMode = repeatMode === 'off' ? 'on' : 'off';
    repeatText.textContent = `Repeat: ${repeatMode === 'on' ? 'On' : 'Off'}`;
    repeatBtn.classList.toggle('active', repeatMode === 'on');
    console.log('Repeat:', repeatMode);
}

// Update progress bar
function updateProgress() {
    if (!audio.duration || isNaN(audio.duration)) return;
    
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${progress}%`;
    currentTimeEl.textContent = formatTime(audio.currentTime);
}

// Seek in song
function seek(e) {
    if (!audio.duration || isNaN(audio.duration)) return;
    
    const clickX = e.offsetX;
    const containerWidth = this.clientWidth;
    const percent = clickX / containerWidth;
    
    audio.currentTime = percent * audio.duration;
}

// Update duration display
function updateDuration() {
    if (!audio.duration || isNaN(audio.duration)) return;
    durationEl.textContent = formatTime(audio.duration);
}

// Handle song end
function handleSongEnd() {
    if (repeatMode === 'on') {
        // Repeat current song
        audio.currentTime = 0;
        audio.play().catch(console.error);
    } else {
        // Auto-play next song
        nextSong();
    }
}

// Render playlist
function renderPlaylist() {
    playlistItems.innerHTML = '';
    
    songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = `playlist-item ${index === currentIndex ? 'active' : ''}`;
        item.innerHTML = `
            <img src="${song.cover}" alt="${song.title}">
            <div class="playlist-info">
                <div class="playlist-title">${song.title}</div>
                <div class="playlist-artist">${song.artist}</div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            loadSong(index);
            if (isPlaying) {
                audio.play().catch(console.error);
            }
        });
        
        playlistItems.appendChild(item);
    });
}

// Update playlist UI
function updatePlaylistUI() {
    document.querySelectorAll('.playlist-item').forEach((item, index) => {
        item.classList.toggle('active', index === currentIndex);
    });
}

// Setup event listeners
function setupEventListeners() {
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
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        isPlaying = true;
    });
    audio.addEventListener('pause', () => {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
    });
    
    // Error handling
    audio.addEventListener('error', (e) => {
        console.error('Audio error:', audio.error);
        if (audio.error && audio.error.code === 4) {
            // Media not found, try next song
            console.log('File not found, trying next song...');
            setTimeout(nextSong, 1000);
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
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
    
    // Enable audio on page load for mobile
    document.addEventListener('click', function enableAudioOnce() {
        enableAudio();
        document.removeEventListener('click', enableAudioOnce);
    }, { once: true });
}

// Initialize player
function init() {
    // Load first song
    loadSong(0);
    
    // Render playlist
    renderPlaylist();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('Music Player Ready!');
}

// Start the player when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
