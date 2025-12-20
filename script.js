// Configuration
const CONFIG = {
    songs: [
        {
            title: "Chinmoku no Majo",
            artist: "Yoshihisa Kato",
            src: "lagu/song1.mp3",
            cover: "gambar/song1.jpg",
            duration: "3:45"
        },
        {
            title: "Mizlecca",
            artist: "Hagali",
            src: "lagu/song2.mp3",
            cover: "gambar/song2.jpeg",
            duration: "4:20"
        },
        {
            title: "Fig Luudhran",
            artist: "Hagali",
            src: "lagu/song3.mp3",
            cover: "gambar/song3.jpg",
            duration: "3:55"
        },
        {
            title: "Ebari and The Forest",
            artist: "Hagali",
            src: "lagu/song4.mp3",
            cover: "gambar/song4.jpg",
            duration: "4:10"
        }
    ],
    defaultVolume: 0.8,
    crossfadeDuration: 0,
    audioQuality: 'medium'
};

// State Management
let state = {
    currentSongIndex: 0,
    isPlaying: false,
    repeatMode: 'off', // 'off', 'all', 'one'
    shuffleMode: false,
    autoplay: true,
    volume: CONFIG.defaultVolume,
    isAudioEnabled: false,
    deferredPrompt: null,
    visualizerAnimation: null
};

// DOM Elements
const elements = {
    audio: document.getElementById('audio'),
    playBtn: document.getElementById('play-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    repeatBtn: document.getElementById('repeat-btn'),
    shuffleBtn: document.getElementById('shuffle-btn'),
    autoplayBtn: document.getElementById('autoplay-btn'),
    progress: document.getElementById('progress'),
    volume: document.getElementById('volume'),
    title: document.getElementById('title'),
    artist: document.getElementById('artist'),
    cover: document.getElementById('cover'),
    currentTime: document.getElementById('current-time'),
    duration: document.getElementById('duration'),
    playlist: document.getElementById('playlist'),
    songCount: document.getElementById('song-count'),
    themeToggle: document.getElementById('theme-toggle'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    closeSettings: document.getElementById('close-settings'),
    loading: document.getElementById('loading'),
    mainContent: document.getElementById('main-content'),
    visualizer: document.getElementById('visualizer'),
    toast: document.getElementById('toast'),
    installPrompt: document.getElementById('install-prompt'),
    installBtn: document.getElementById('install-btn'),
    installClose: document.getElementById('install-close')
};

// Initialize Application
function initApp() {
    // Set initial volume
    elements.audio.volume = state.volume;
    elements.volume.value = state.volume * 100;
    
    // Load first song
    loadSong(state.currentSongIndex);
    
    // Render playlist
    renderPlaylist();
    
    // Update UI
    updateUI();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup service worker for PWA
    setupServiceWorker();
    
    // Check for install prompt
    setupInstallPrompt();
    
    // Auto-hide loading screen
    setTimeout(() => {
        elements.loading.style.opacity = '0';
        setTimeout(() => {
            elements.loading.style.display = 'none';
            elements.mainContent.style.display = 'block';
            showToast('Music Player Ready! 🎵');
        }, 500);
    }, 1500);
}

// Setup Event Listeners
function setupEventListeners() {
    // Player controls
    elements.playBtn.addEventListener('click', togglePlay);
    elements.prevBtn.addEventListener('click', prevSong);
    elements.nextBtn.addEventListener('click', nextSong);
    
    // Mode controls
    elements.repeatBtn.addEventListener('click', toggleRepeat);
    elements.shuffleBtn.addEventListener('click', toggleShuffle);
    elements.autoplayBtn.addEventListener('click', toggleAutoplay);
    
    // Progress and volume
    elements.progress.addEventListener('input', seekTo);
    elements.volume.addEventListener('input', updateVolume);
    
    // Audio events
    elements.audio.addEventListener('timeupdate', updateProgress);
    elements.audio.addEventListener('loadedmetadata', updateDuration);
    elements.audio.addEventListener('ended', handleSongEnd);
    elements.audio.addEventListener('play', () => {
        state.isPlaying = true;
        updateUI();
        startVisualizer();
    });
    elements.audio.addEventListener('pause', () => {
        state.isPlaying = false;
        updateUI();
        stopVisualizer();
    });
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Settings
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsPanel.classList.add('active');
    });
    
    elements.closeSettings.addEventListener('click', () => {
        elements.settingsPanel.classList.remove('active');
    });
    
    // Bottom navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const target = this.dataset.target;
            // Handle navigation (simplified for demo)
            if (target === 'player') {
                // Scroll to player section
                document.querySelector('.now-playing').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Touch gestures
    setupTouchGestures();
    
    // Page visibility
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

// Load Song
function loadSong(index) {
    if (index < 0) index = CONFIG.songs.length - 1;
    if (index >= CONFIG.songs.length) index = 0;
    
    state.currentSongIndex = index;
    const song = CONFIG.songs[index];
    
    // Update audio source with cache-busting for mobile
    elements.audio.src = `${song.src}?t=${Date.now()}`;
    
    // Update UI
    elements.title.textContent = song.title;
    elements.artist.textContent = song.artist;
    elements.cover.src = song.cover;
    
    // Update active playlist item
    updateActivePlaylistItem();
    
    // Update visualizer
    updateVisualizer();
    
    // Auto-play if enabled and was playing
    if (state.autoplay && state.isPlaying) {
        setTimeout(() => {
            playSong().catch(console.error);
        }, 300);
    }
}

// Play/Pause
async function togglePlay() {
    try {
        if (!state.isAudioEnabled) {
            await enableAudio();
        }
        
        if (elements.audio.paused) {
            await playSong();
        } else {
            elements.audio.pause();
        }
    } catch (error) {
        console.error('Play error:', error);
        showToast('Click again to play music');
    }
}

// Play Song with mobile compatibility
async function playSong() {
    try {
        await elements.audio.play();
        state.isPlaying = true;
        updateUI();
        showToast('Now Playing 🎶');
    } catch (error) {
        // Handle autoplay restrictions
        if (error.name === 'NotAllowedError') {
            showToast('Tap to play music');
            state.isAudioEnabled = false;
        }
        throw error;
    }
}

// Next Song
function nextSong() {
    let nextIndex;
    
    if (state.shuffleMode) {
        do {
            nextIndex = Math.floor(Math.random() * CONFIG.songs.length);
        } while (nextIndex === state.currentSongIndex && CONFIG.songs.length > 1);
    } else {
        nextIndex = state.currentSongIndex + 1;
    }
    
    loadSong(nextIndex);
    
    if (state.autoplay) {
        setTimeout(() => playSong(), 100);
    }
}

// Previous Song
function prevSong() {
    let prevIndex = state.currentSongIndex - 1;
    
    // If less than 3 seconds played, go to previous song, otherwise restart current
    if (elements.audio.currentTime > 3) {
        elements.audio.currentTime = 0;
        return;
    }
    
    loadSong(prevIndex);
    
    if (state.autoplay) {
        setTimeout(() => playSong(), 100);
    }
}

// Toggle Repeat Mode
function toggleRepeat() {
    const modes = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(state.repeatMode);
    state.repeatMode = modes[(currentIndex + 1) % modes.length];
    updateUI();
    showToast(`Repeat: ${state.repeatMode}`);
}

// Toggle Shuffle
function toggleShuffle() {
    state.shuffleMode = !state.shuffleMode;
    updateUI();
    showToast(`Shuffle: ${state.shuffleMode ? 'On' : 'Off'}`);
}

// Toggle Autoplay
function toggleAutoplay() {
    state.autoplay = !state.autoplay;
    updateUI();
    showToast(`Auto-play: ${state.autoplay ? 'On' : 'Off'}`);
}

// Update Progress Bar
function updateProgress() {
    if (!elements.audio.duration || isNaN(elements.audio.duration)) return;
    
    const progress = (elements.audio.currentTime / elements.audio.duration) * 100;
    elements.progress.value = progress;
    elements.currentTime.textContent = formatTime(elements.audio.currentTime);
    
    // Update CSS custom property for progress bar background
    document.documentElement.style.setProperty('--progress', `${progress}%`);
}

// Seek to Position
function seekTo() {
    if (!elements.audio.duration || isNaN(elements.audio.duration)) return;
    
    const time = (elements.progress.value / 100) * elements.audio.duration;
    elements.audio.currentTime = time;
}

// Update Volume
function updateVolume() {
    state.volume = elements.volume.value / 100;
    elements.audio.volume = state.volume;
    localStorage.setItem('volume', state.volume);
}

// Update Duration Display
function updateDuration() {
    if (!elements.audio.duration || isNaN(elements.audio.duration)) return;
    
    elements.duration.textContent = formatTime(elements.audio.duration);
    
    // Update playlist item duration
    const playlistItems = document.querySelectorAll('.playlist-item');
    if (playlistItems[state.currentSongIndex]) {
        const durationSpan = playlistItems[state.currentSongIndex].querySelector('.playlist-duration');
        if (durationSpan) {
            durationSpan.textContent = formatTime(elements.audio.duration);
        }
    }
}

// Handle Song End
function handleSongEnd() {
    if (state.repeatMode === 'one') {
        elements.audio.currentTime = 0;
        playSong();
    } else if (state.repeatMode === 'all' || state.autoplay) {
        nextSong();
    } else {
        state.isPlaying = false;
        updateUI();
    }
}

// Enable Audio (for mobile restrictions)
async function enableAudio() {
    try {
        // iOS/Android workaround
        elements.audio.volume = 0.01;
        await elements.audio.play();
        await elements.audio.pause();
        elements.audio.currentTime = 0;
        elements.audio.volume = state.volume;
        state.isAudioEnabled = true;
        
        // Store in localStorage
        localStorage.setItem('audioEnabled', 'true');
    } catch (error) {
        console.log('Audio enable failed:', error);
    }
}

// Render Playlist
function renderPlaylist() {
    elements.playlist.innerHTML = '';
    elements.songCount.textContent = `${CONFIG.songs.length} songs`;
    
    CONFIG.songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = `playlist-item ${index === state.currentSongIndex ? 'active' : ''}`;
        item.innerHTML = `
            <img src="${song.cover}" alt="${song.title}" crossorigin="anonymous">
            <div class="playlist-info">
                <div class="playlist-title">${song.title}</div>
                <div class="playlist-artist">${song.artist}</div>
            </div>
            <div class="playlist-duration">${song.duration}</div>
        `;
        
        item.addEventListener('click', () => {
            loadSong(index);
            if (state.autoplay) {
                playSong();
            }
            showToast(`Playing: ${song.title}`);
        });
        
        elements.playlist.appendChild(item);
    });
}

// Update Active Playlist Item
function updateActivePlaylistItem() {
    document.querySelectorAll('.playlist-item').forEach((item, index) => {
        item.classList.toggle('active', index === state.currentSongIndex);
    });
}

// Update UI
function updateUI() {
    // Update play button
    elements.playBtn.innerHTML = `<i class="fas fa-${state.isPlaying ? 'pause' : 'play'}"></i>`;
    
    // Update mode buttons
    elements.repeatBtn.classList.toggle('active', state.repeatMode !== 'off');
    elements.repeatBtn.querySelector('.mode-text').textContent = state.repeatMode;
    
    elements.shuffleBtn.classList.toggle('active', state.shuffleMode);
    elements.shuffleBtn.querySelector('.mode-text').textContent = state.shuffleMode ? 'On' : 'Off';
    
    elements.autoplayBtn.classList.toggle('active', state.autoplay);
    elements.autoplayBtn.querySelector('.mode-text').textContent = state.autoplay ? 'On' : 'Off';
    
    // Update album art animation
    const albumArt = document.querySelector('.album-art');
    if (state.isPlaying) {
        albumArt.style.animationPlayState = 'running';
    } else {
        albumArt.style.animationPlayState = 'paused';
    }
}

// Toggle Theme
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', newTheme);
    elements.themeToggle.innerHTML = `<i class="fas fa-${newTheme === 'light' ? 'sun' : 'moon'}"></i>`;
    
    localStorage.setItem('theme', newTheme);
    showToast(`${newTheme === 'light' ? 'Light' : 'Dark'} theme enabled`);
}

// Format Time
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Show Toast Notification
function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Visualizer Animation
function startVisualizer() {
    if (state.visualizerAnimation) return;
    
    const bars = elements.visualizer.querySelectorAll('.bar');
    let frame = 0;
    
    function animate() {
        bars.forEach((bar, i) => {
            const scale = 0.5 + Math.abs(Math.sin(frame * 0.1 + i * 0.5));
            bar.style.transform = `scaleY(${scale})`;
        });
        
        frame++;
        state.visualizerAnimation = requestAnimationFrame(animate);
    }
    
    animate();
}

function stopVisualizer() {
    if (state.visualizerAnimation) {
        cancelAnimationFrame(state.visualizerAnimation);
        state.visualizerAnimation = null;
    }
    
    const bars = elements.visualizer.querySelectorAll('.bar');
    bars.forEach(bar => {
        bar.style.transform = 'scaleY(0.5)';
    });
}

function updateVisualizer() {
    // Visualizer color based on album art (simplified)
    const hue = Math.random() * 360;
    elements.visualizer.querySelectorAll('.bar').forEach(bar => {
        bar.style.background = `hsl(${hue}, 70%, 60%)`;
    });
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
    // Don't trigger if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch(e.key.toLowerCase()) {
        case ' ':
            e.preventDefault();
            togglePlay();
            break;
        case 'arrowright':
            e.preventDefault();
            nextSong();
            break;
        case 'arrowleft':
            e.preventDefault();
            prevSong();
            break;
        case 'r':
            if (e.ctrlKey) {
                e.preventDefault();
                toggleRepeat();
            }
            break;
        case 's':
            if (e.ctrlKey) {
                e.preventDefault();
                toggleShuffle();
            }
            break;
        case 'a':
            if (e.ctrlKey) {
                e.preventDefault();
                toggleAutoplay();
            }
            break;
        case 'm':
            if (e.ctrlKey) {
                e.preventDefault();
                elements.audio.muted = !elements.audio.muted;
                showToast(`Mute: ${elements.audio.muted ? 'On' : 'Off'}`);
            }
            break;
    }
}

// Touch Gestures
function setupTouchGestures() {
    let startX, startY;
    let isHorizontal = false;
    
    document.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isHorizontal = false;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        if (!startX || !startY || isHorizontal) return;
        
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;
        
        // Determine if horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) * 2) {
            isHorizontal = true;
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchend', (e) => {
        if (!startX || !startY || !isHorizontal) return;
        
        const deltaX = e.changedTouches[0].clientX - startX;
        
        // Swipe right for previous, left for next
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                prevSong();
            } else {
                nextSong();
            }
            showToast(deltaX > 0 ? 'Previous' : 'Next');
        }
        
        startX = startY = null;
        isHorizontal = false;
    }, { passive: true });
    
    // Double tap to play/pause
    let lastTap = 0;
    document.addEventListener('touchstart', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 500 && tapLength > 0) {
            // Double tap detected
            e.preventDefault();
            togglePlay();
        }
        
        lastTap = currentTime;
    }, { passive: true });
}

// Handle Visibility Change
function handleVisibilityChange() {
    if (document.hidden) {
        // Page is hidden, pause if playing
        if (state.isPlaying) {
            elements.audio.dataset.wasPlaying = 'true';
        }
    } else if (elements.audio.dataset.wasPlaying === 'true') {
        // Page is visible again, resume if was playing
        delete elements.audio.dataset.wasPlaying;
        if (state.autoplay) {
            playSong().catch(console.error);
        }
    }
}

// PWA Installation
function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        state.deferredPrompt = e;
        
        // Show install prompt after 5 seconds
        setTimeout(() => {
            if (state.deferredPrompt && !isAppInstalled()) {
                elements.installPrompt.classList.add('show');
            }
        }, 5000);
    });
    
    elements.installBtn.addEventListener('click', async () => {
        if (!state.deferredPrompt) return;
        
        state.deferredPrompt.prompt();
        const { outcome } = await state.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            showToast('App installed successfully!');
        }
        
        elements.installPrompt.classList.remove('show');
        state.deferredPrompt = null;
    });
    
    elements.installClose.addEventListener('click', () => {
        elements.installPrompt.classList.remove('show');
    });
}

function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           navigator.standalone ||
           document.referrer.includes('android-app://');
}

// Service Worker for PWA
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(console.error);
        });
    }
}

// Load saved preferences
function loadPreferences() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        elements.themeToggle.innerHTML = `<i class="fas fa-${savedTheme === 'light' ? 'sun' : 'moon'}"></i>`;
    }
    
    const savedVolume = localStorage.getItem('volume');
    if (savedVolume) {
        state.volume = parseFloat(savedVolume);
        elements.audio.volume = state.volume;
        elements.volume.value = state.volume * 100;
    }
    
    const audioEnabled = localStorage.getItem('audioEnabled');
    if (audioEnabled === 'true') {
        state.isAudioEnabled = true;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadPreferences();
    initApp();
});

// Handle offline/online status
window.addEventListener('online', () => {
    showToast('Back online!');
});

window.addEventListener('offline', () => {
    showToast('You are offline');
});

// Prevent pull-to-refresh on mobile
document.addEventListener('touchmove', (e) => {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });const prevBtn = document.getElementById('prev');
const repeatBtn = document.getElementById('repeat-btn');
const autoplayBtn = document.getElementById('autoplay-btn');
const progress = document.getElementById('progress');
const title = document.getElementById('title');
const artist = document.getElementById('artist');
const cover = document.getElementById('cover');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const repeatStatusEl = document.getElementById('repeat-status');
const autoplayStatusEl = document.getElementById('autoplay-status');

// Format waktu
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update status display
function updateStatusDisplay() {
  const repeatTexts = {
    'off': 'Repeat: Off',
    'all': 'Repeat: All',
    'one': 'Repeat: One'
  };
  
  repeatStatusEl.textContent = repeatTexts[repeatMode];
  autoplayStatusEl.textContent = `Auto-play: ${autoplayEnabled ? 'On' : 'Off'}`;
  
  // Update button appearance
  repeatBtn.className = '';
  if (repeatMode === 'all') {
    repeatBtn.classList.add('active');
  } else if (repeatMode === 'one') {
    repeatBtn.classList.add('active', 'repeat-one');
  }
  
  autoplayBtn.classList.toggle('active', autoplayEnabled);
}

// Toggle repeat mode
function toggleRepeat() {
  const modes = ['off', 'all', 'one'];
  const currentIndex = modes.indexOf(repeatMode);
  repeatMode = modes[(currentIndex + 1) % modes.length];
  updateStatusDisplay();
  
  // Change icon based on mode
  const icons = {
    'off': 'fa-redo',
    'all': 'fa-redo',
    'one': 'fa-redo-alt'
  };
  
  repeatBtn.innerHTML = `<i class="fas ${icons[repeatMode]}"></i>`;
  
  console.log(`Repeat mode: ${repeatMode}`);
}

// Toggle autoplay
function toggleAutoplay() {
  autoplayEnabled = !autoplayEnabled;
  updateStatusDisplay();
  
  // Change icon
  const icon = autoplayEnabled ? 'fa-play-circle' : 'fa-pause-circle';
  autoplayBtn.innerHTML = `<i class="fas ${icon}"></i>`;
  
  console.log(`Auto-play: ${autoplayEnabled ? 'ON' : 'OFF'}`);
}

// Enable audio (untuk browser restrictions)
function enableAudio() {
  if (isAudioEnabled) return Promise.resolve();
  
  return new Promise((resolve) => {
    // Coba play audio yang sangat kecil volumenya
    const originalVolume = audio.volume;
    audio.volume = 0.01;
    
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = originalVolume;
      isAudioEnabled = true;
      console.log("Audio enabled successfully");
      resolve();
    }).catch(error => {
      console.log("Auto-enable failed, will enable on first user click");
      isAudioEnabled = false;
      resolve();
    });
  });
}

// Load song
function loadSong(index) {
  if (index < 0) index = songs.length - 1;
  if (index >= songs.length) index = 0;
  
  currentSongIndex = index;
  const song = songs[index];
  
  // Update UI
  title.textContent = song.title;
  artist.textContent = song.artist;
  cover.src = song.cover;
  
  // Set audio source
  audio.src = song.src;
  
  // Reset progress
  progress.value = 0;
  currentTimeEl.textContent = "0:00";
  
  // Load audio
  audio.load();
  
  console.log(`Loaded: ${song.title}`);
  
  // Update duration when metadata loads
  audio.addEventListener('loadedmetadata', function updateDuration() {
    if (audio.duration && !isNaN(audio.duration)) {
      durationEl.textContent = formatTime(audio.duration);
    }
    audio.removeEventListener('loadedmetadata', updateDuration);
  }, { once: true });
}

// Play/pause audio
async function togglePlay() {
  try {
    if (!isAudioEnabled) {
      await enableAudio();
    }
    
    if (audio.paused) {
      await audio.play();
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
      audio.pause();
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  } catch (error) {
    console.error("Play error:", error);
    
    // Jika gagal karena user interaction, minta user klik
    if (error.name === 'NotAllowedError') {
      alert("Please click the Play button again to start music");
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  }
}

// Next song dengan auto-play
function nextSong() {
  // Tampilkan loading state
  const originalHTML = nextBtn.innerHTML;
  nextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  nextBtn.disabled = true;
  
  // Simpan apakah sedang play
  const wasPlaying = !audio.paused;
  
  // Tentukan lagu berikutnya
  let nextIndex = currentSongIndex + 1;
  if (nextIndex >= songs.length) nextIndex = 0;
  
  loadSong(nextIndex);
  
  // Jika sebelumnya sedang play DAN auto-play enabled, play lagu baru
  if (wasPlaying && autoplayEnabled) {
    setTimeout(() => {
      audio.play().then(() => {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      }).catch(console.error);
    }, 300);
  } else if (wasPlaying) {
    // Jika auto-play off, tetap update play button ke Play
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
  
  // Reset button setelah 500ms
  setTimeout(() => {
    nextBtn.innerHTML = originalHTML;
    nextBtn.disabled = false;
  }, 500);
}

// Previous song dengan auto-play
function prevSong() {
  // Tampilkan loading state
  const originalHTML = prevBtn.innerHTML;
  prevBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  prevBtn.disabled = true;
  
  // Simpan apakah sedang play
  const wasPlaying = !audio.paused;
  
  // Tentukan lagu sebelumnya
  let prevIndex = currentSongIndex - 1;
  if (prevIndex < 0) prevIndex = songs.length - 1;
  
  loadSong(prevIndex);
  
  // Jika sebelumnya sedang play DAN auto-play enabled, play lagu baru
  if (wasPlaying && autoplayEnabled) {
    setTimeout(() => {
      audio.play().then(() => {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      }).catch(console.error);
    }, 300);
  } else if (wasPlaying) {
    // Jika auto-play off, tetap update play button ke Play
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
  
  // Reset button setelah 500ms
  setTimeout(() => {
    prevBtn.innerHTML = originalHTML;
    prevBtn.disabled = false;
  }, 500);
}

// Update progress bar
audio.addEventListener('timeupdate', () => {
  if (audio.duration && !isNaN(audio.duration)) {
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    progress.value = progressPercent;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
});

// Seek when progress bar is changed
progress.addEventListener('input', () => {
  if (audio.duration && !isNaN(audio.duration)) {
    const seekTime = (progress.value / 100) * audio.duration;
    audio.currentTime = seekTime;
  }
});

// When song ends
audio.addEventListener('ended', () => {
  console.log("Song ended, repeat mode:", repeatMode);
  
  if (repeatMode === 'one') {
    // Repeat satu lagu
    audio.currentTime = 0;
    audio.play().then(() => {
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }).catch(console.error);
  } else if (repeatMode === 'all') {
    // Repeat semua lagu, lanjut ke next
    nextSong();
  } else if (autoplayEnabled) {
    // Auto-play ke next lagu jika enabled
    nextSong();
  } else {
    // Hanya stop
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Load first song
  loadSong(0);
  
  // Update status display
  updateStatusDisplay();
  
  // Enable audio on first click
  document.addEventListener('click', function enableOnClick() {
    enableAudio();
    document.removeEventListener('click', enableOnClick);
  }, { once: true });
});

// Event listeners
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextSong);
prevBtn.addEventListener('click', prevSong);
repeatBtn.addEventListener('click', toggleRepeat);
autoplayBtn.addEventListener('click', toggleAutoplay);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  switch(e.code) {
    case 'Space':
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
    case 'KeyR':
      if (e.ctrlKey) {
        e.preventDefault();
        toggleRepeat();
      }
      break;
    case 'KeyA':
      if (e.ctrlKey) {
        e.preventDefault();
        toggleAutoplay();
      }
      break;
  }
});

// Handle page visibility (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !audio.paused) {
    audio.dataset.wasPlaying = 'true';
  } else if (!document.hidden && audio.dataset.wasPlaying === 'true') {
    delete audio.dataset.wasPlaying;
    if (autoplayEnabled) {
      audio.play().catch(console.error);
    }
  }
});

// Error handling
audio.addEventListener('error', (e) => {
  console.error('Audio error:', audio.error);
  
  // Fallback: coba load lagu berikutnya jika error
  if (audio.error && audio.error.code === 4) {
    console.log('Media not found, trying next song...');
    setTimeout(() => {
      nextSong();
    }, 1000);
  }
});const prevBtn = document.getElementById("prev");
const progress = document.getElementById("progress");
const title = document.getElementById("title");
const artist = document.getElementById("artist");
const cover = document.getElementById("cover");

// Error handling untuk audio
audio.addEventListener('error', function(e) {
  console.error('Audio Error:', audio.error);
  alert(`Error loading audio: ${audio.error?.message || 'Unknown error'}. Please check if audio files exist.`);
});

// Fungsi untuk unlock audio - versi lebih sederhana
function unlockAudio() {
  if (isAudioUnlocked) return Promise.resolve(true);
  
  console.log("Unlocking audio...");
  
  return new Promise((resolve) => {
    // Create silent buffer dan play
    const silentBuffer = audioContext?.createBuffer(1, 1, 22050);
    if (silentBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    }
    
    // Coba play audio dengan volume normal
    audio.volume = 0.1;
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1.0;
        isAudioUnlocked = true;
        console.log("Audio unlocked successfully");
        resolve(true);
      }).catch(error => {
        console.log("First unlock attempt failed:", error.message);
        // Coba pendekatan lain
        document.body.addEventListener('click', function unlockHandler() {
          audio.volume = 0.1;
          audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1.0;
            isAudioUnlocked = true;
            console.log("Audio unlocked via user interaction");
            document.body.removeEventListener('click', unlockHandler);
            resolve(true);
          }).catch(e => {
            console.log("Still failed, will try later:", e.message);
            document.body.removeEventListener('click', unlockHandler);
            resolve(false);
          });
        }, { once: true });
      });
    } else {
      isAudioUnlocked = true;
      resolve(true);
    }
  });
}

// Fungsi load song yang lebih baik
async function loadSong(i) {
  if (i < 0) i = songs.length - 1;
  if (i >= songs.length) i = 0;
  
  index = i;
  const song = songs[i];
  
  // Simpan state play sebelumnya
  wasPlaying = !audio.paused;
  
  // Update UI
  title.textContent = song.title;
  artist.textContent = song.artist;
  cover.src = song.cover;
  
  // Pause dulu jika sedang play
  if (!audio.paused) {
    audio.pause();
  }
  
  // Update audio source
  audio.src = song.src;
  
  // Reset progress bar
  progress.value = 0;
  
  // Load audio baru
  audio.load();
  
  console.log(`Loaded: ${song.title} - ${song.artist}`);
  
  // Tunggu sampai audio siap
  await new Promise(resolve => {
    if (audio.readyState >= 3) { // HAVE_FUTURE_DATA
      resolve();
    } else {
      audio.addEventListener('loadeddata', () => resolve(), { once: true });
    }
  });
  
  return true;
}

// Fungsi play audio
async function playAudio() {
  try {
    // Cek jika audio sudah unlocked
    if (!isAudioUnlocked) {
      await unlockAudio();
    }
    
    // Pastikan audio context aktif (untuk mobile)
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Coba play
    await audio.play();
    playBtn.textContent = "⏸ Pause";
    console.log("Playing audio");
    return true;
  } catch (error) {
    console.error("Play failed:", error);
    
    // Coba sekali lagi dengan delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      await audio.play();
      playBtn.textContent = "⏸ Pause";
      return true;
    } catch (secondError) {
      console.error("Second attempt failed:", secondError);
      playBtn.textContent = "▶ Play";
      
      // Tampilkan pesan user-friendly untuk mobile
      if (secondError.name === 'NotAllowedError') {
        console.log("Please tap the screen to enable audio playback");
      }
      
      return false;
    }
  }
}

// Inisialisasi saat DOM ready
document.addEventListener('DOMContentLoaded', async function() {
  // Create Audio Context jika supported
  if (window.AudioContext || window.webkitAudioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  // Load first song
  await loadSong(index);
  
  // Auto-unlock audio dengan user interaction
  const unlockEvents = ['click', 'touchstart', 'keydown'];
  
  unlockEvents.forEach(eventType => {
    document.addEventListener(eventType, function unlockOnce() {
      unlockAudio();
      // Hapus listener setelah pertama kali di-trigger
      unlockEvents.forEach(type => {
        document.removeEventListener(type, unlockOnce);
      });
    }, { once: true });
  });
});

// Play/Pause button
playBtn.addEventListener('click', async function(e) {
  e.preventDefault();
  
  if (audio.paused) {
    await playAudio();
  } else {
    audio.pause();
    playBtn.textContent = "▶ Play";
  }
});

// Next button
nextBtn.addEventListener('click', async function(e) {
  e.preventDefault();
  
  // Tampilkan loading state
  const originalText = nextBtn.textContent;
  const originalHTML = nextBtn.innerHTML;
  nextBtn.textContent = "Loading...";
  nextBtn.disabled = true;
  nextBtn.style.opacity = "0.7";
  
  try {
    // Load next song
    await loadSong((index + 1) % songs.length);
    
    // Auto-play jika sebelumnya sedang play
    if (wasPlaying) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await playAudio();
    }
  } catch (error) {
    console.error("Error on next:", error);
  } finally {
    // Restore button
    nextBtn.textContent = originalText;
    nextBtn.innerHTML = originalHTML;
    nextBtn.disabled = false;
    nextBtn.style.opacity = "1";
  }
});

// Prev button
prevBtn.addEventListener('click', async function(e) {
  e.preventDefault();
  
  // Tampilkan loading state
  const originalText = prevBtn.textContent;
  const originalHTML = prevBtn.innerHTML;
  prevBtn.textContent = "Loading...";
  prevBtn.disabled = true;
  prevBtn.style.opacity = "0.7";
  
  try {
    // Load previous song
    await loadSong((index - 1 + songs.length) % songs.length);
    
    // Auto-play jika sebelumnya sedang play
    if (wasPlaying) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await playAudio();
    }
  } catch (error) {
    console.error("Error on prev:", error);
  } finally {
    // Restore button
    prevBtn.textContent = originalText;
    prevBtn.innerHTML = originalHTML;
    prevBtn.disabled = false;
    prevBtn.style.opacity = "1";
  }
});

// Progress bar update
audio.addEventListener('timeupdate', function() {
  if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
    const value = (audio.currentTime / audio.duration) * 100;
    progress.value = value;
    
    // Update progress bar text jika ada
    const progressText = document.getElementById('progress-time');
    if (progressText) {
      const current = formatTime(audio.currentTime);
      const total = formatTime(audio.duration);
      progressText.textContent = `${current} / ${total}`;
    }
  }
});

// Helper untuk format waktu
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Progress bar seek
progress.addEventListener('input', function() {
  if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
    audio.currentTime = (progress.value / 100) * audio.duration;
  }
});

// When audio ends - auto play next
audio.addEventListener('ended', async function() {
  console.log("Song ended, playing next...");
  playBtn.textContent = "▶ Play";
  
  // Auto-play next song
  await loadSong((index + 1) % songs.length);
  await playAudio();
});

// Event untuk update UI
audio.addEventListener('play', function() {
  playBtn.textContent = "⏸ Pause";
  wasPlaying = true;
});

audio.addEventListener('pause', function() {
  playBtn.textContent = "▶ Play";
  wasPlaying = false;
});

// Keyboard shortcuts - DIPERBAIKI
document.addEventListener('keydown', function(e) {
  switch(e.code) {
    case 'Space':
      e.preventDefault();
      playBtn.click();
      break;
    case 'ArrowRight':
      e.preventDefault();
      nextBtn.click();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      prevBtn.click();
      break;
  }
});

// Fallback untuk audio error
window.addEventListener('load', function() {
  // Cek jika semua file audio ada
  songs.forEach((song, i) => {
    fetch(song.src, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          console.warn(`File not found: ${song.src}`);
        }
      })
      .catch(() => {
        console.warn(`Cannot access: ${song.src}`);
      });
  });
});

// Tambahan: handle visibility change (saat tab di-switch)
document.addEventListener('visibilitychange', function() {
  if (document.hidden && !audio.paused) {
    // Simpan state untuk resume nanti
    audio.dataset.wasPlaying = 'true';
  } else if (!document.hidden && audio.dataset.wasPlaying === 'true') {
    // Coba resume play jika sebelumnya sedang play
    delete audio.dataset.wasPlaying;
    if (wasPlaying) {
      playAudio().catch(() => {
        // Ignore error saat resume
      });
    }
  }
});const prevBtn = document.getElementById("prev");
const progress = document.getElementById("progress");
const title = document.getElementById("title");
const artist = document.getElementById("artist");
const cover = document.getElementById("cover");

// Error handling untuk audio
audio.addEventListener('error', function(e) {
  console.error('Audio Error:', audio.error);
  alert(`Error loading audio: ${audio.error?.message || 'Unknown error'}. Please check if audio files exist.`);
});

// Fungsi untuk unlock audio
function unlockAudio() {
  if (isAudioUnlocked) return Promise.resolve(true);
  
  console.log("Unlocking audio...");
  
  // Create Audio Context jika belum ada
  if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  const promises = [];
  
  // Resume Audio Context jika suspended
  if (audioContext && audioContext.state === 'suspended') {
    promises.push(audioContext.resume().then(() => {
      console.log("AudioContext resumed");
    }));
  }
  
  // iOS/Android workaround: play silent audio
  const originalVolume = audio.volume;
  audio.volume = 0.001; // Sangat kecil, hampir silent
  
  // Jika audio sudah memiliki src, coba play
  if (audio.src) {
    const playPromise = audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      return true;
    }).catch(error => {
      console.log("Silent play attempt:", error.message);
      return false; // Tidak masalah jika gagal
    });
    promises.push(playPromise);
  }
  
  audio.volume = originalVolume; // Kembalikan volume
  
  return Promise.all(promises).then(() => {
    isAudioUnlocked = true;
    console.log("Audio unlocked");
    return true;
  }).catch(() => {
    isAudioUnlocked = true; // Tetap anggap unlocked untuk percobaan
    return true;
  });
}

// Fungsi load song dengan Promise
function loadSong(i) {
  return new Promise((resolve) => {
    if (i < 0 || i >= songs.length) {
      i = 0; // Reset ke pertama jika out of bounds
    }
    
    index = i;
    const song = songs[i];
    
    // Update UI
    title.textContent = song.title;
    artist.textContent = song.artist;
    cover.src = song.cover;
    
    // Simpan state play sebelumnya
    wasPlaying = !audio.paused;
    
    // Pause dulu jika sedang play
    if (!audio.paused) {
      audio.pause();
    }
    
    // Update audio source
    audio.src = song.src;
    
    // Load audio baru
    audio.load();
    
    console.log(`Loaded: ${song.title} - ${song.artist}`);
    
    // Set timeout untuk memastikan audio siap
    setTimeout(() => {
      resolve(true);
    }, 100);
  });
}

// Fungsi play dengan Promise
function playAudio() {
  return new Promise((resolve, reject) => {
    // Cek jika audio sudah unlocked
    if (!isAudioUnlocked) {
      unlockAudio().then(() => {
        attemptPlay(resolve, reject);
      }).catch(() => {
        attemptPlay(resolve, reject);
      });
    } else {
      attemptPlay(resolve, reject);
    }
  });
}

// Helper function untuk attempt play
function attemptPlay(resolve, reject) {
  // Set timeout kecil untuk menghindari race condition
  setTimeout(() => {
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        playBtn.textContent = "⏸ Pause";
        console.log("Playing audio");
        resolve(true);
      }).catch(error => {
        console.error("Play failed:", error);
        
        // Coba sekali lagi dengan delay
        setTimeout(() => {
          audio.play()
            .then(() => {
              playBtn.textContent = "⏸ Pause";
              resolve(true);
            })
            .catch(e => {
              console.error("Second attempt failed:", e);
              playBtn.textContent = "▶ Play";
              reject(e);
            });
        }, 300);
      });
    } else {
      resolve(false); // Browser tidak support Promise
    }
  }, 50);
}

// Event Listeners saat DOM ready
document.addEventListener('DOMContentLoaded', function() {
  // Load first song
  loadSong(index);
  
  // Global click/touch untuk unlock audio
  document.addEventListener('click', function() {
    unlockAudio();
  });
  
  document.addEventListener('touchstart', function() {
    unlockAudio();
  }, { passive: true });
});

// Play/Pause button
playBtn.addEventListener('click', function(e) {
  e.preventDefault();
  
  if (audio.paused) {
    playAudio().catch(error => {
      console.log("Manual play attempt failed:", error);
      // Tidak perlu alert, biarkan user coba lagi
    });
  } else {
    audio.pause();
    playBtn.textContent = "▶ Play";
    wasPlaying = false;
  }
});

// Next button dengan autoplay fix
nextBtn.addEventListener('click', async function(e) {
  e.preventDefault();
  
  // Tampilkan loading state
  const originalText = nextBtn.textContent;
  nextBtn.textContent = "Loading...";
  nextBtn.disabled = true;
  
  try {
    // Unlock audio jika perlu
    await unlockAudio();
    
    // Load song berikutnya
    await loadSong((index + 1) % songs.length);
    
    // Jika sebelumnya sedang play atau ini pertama kali, auto-play
    if (wasPlaying) {
      // Tunggu sedikit untuk memastikan audio siap
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Coba play
      try {
        await playAudio();
        console.log("Autoplay setelah next berhasil!");
      } catch (playError) {
        console.log("Autoplay gagal, tapi song berhasil di-load:", playError);
        // Tetap update button ke Play
        playBtn.textContent = "▶ Play";
      }
    } else {
      // Jika sebelumnya tidak play, pastikan button menunjukkan Play
      playBtn.textContent = "▶ Play";
    }
    
  } catch (error) {
    console.error("Error pada next button:", error);
  } finally {
    // Restore button state
    nextBtn.textContent = originalText;
    nextBtn.disabled = false;
  }
});

// Prev button dengan autoplay fix
prevBtn.addEventListener('click', async function(e) {
  e.preventDefault();
  
  // Tampilkan loading state
  const originalText = prevBtn.textContent;
  prevBtn.textContent = "Loading...";
  prevBtn.disabled = true;
  
  try {
    // Unlock audio jika perlu
    await unlockAudio();
    
    // Load song sebelumnya
    await loadSong((index - 1 + songs.length) % songs.length);
    
    // Jika sebelumnya sedang play, auto-play
    if (wasPlaying) {
      // Tunggu sedikit untuk memastikan audio siap
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Coba play
      try {
        await playAudio();
        console.log("Autoplay setelah prev berhasil!");
      } catch (playError) {
        console.log("Autoplay gagal, tapi song berhasil di-load:", playError);
        // Tetap update button ke Play
        playBtn.textContent = "▶ Play";
      }
    } else {
      // Jika sebelumnya tidak play, pastikan button menunjukkan Play
      playBtn.textContent = "▶ Play";
    }
    
  } catch (error) {
    console.error("Error pada prev button:", error);
  } finally {
    // Restore button state
    prevBtn.textContent = originalText;
    prevBtn.disabled = false;
  }
});

// Progress bar update
audio.addEventListener('timeupdate', function() {
  if (audio.duration && !isNaN(audio.duration)) {
    const value = (audio.currentTime / audio.duration) * 100;
    progress.value = value;
  }
});

// Progress bar seek
progress.addEventListener('input', function() {
  if (audio.duration && !isNaN(audio.duration)) {
    audio.currentTime = (progress.value / 100) * audio.duration;
  }
});

// When audio ends - auto play next
audio.addEventListener('ended', function() {
  console.log("Song ended, playing next...");
  playBtn.textContent = "▶ Play";
  wasPlaying = false;
  
  // Auto-play next song setelah delay
  setTimeout(() => {
    // Simulasi klik next button
    nextBtn.click();
  }, 1000); // Delay 1 detik sebelum next
});

// Event ketika audio bisa diputar
audio.addEventListener('canplay', function() {
  console.log("Audio can now play, duration:", audio.duration);
});

// Event ketika metadata loaded
audio.addEventListener('loadedmetadata', function() {
  console.log(`Audio metadata loaded: ${audio.duration} seconds`);
});

// Play state tracking
audio.addEventListener('play', function() {
  wasPlaying = true;
  console.log("Audio started playing");
});

audio.addEventListener('pause', function() {
  wasPlaying = false;
  console.log("Audio paused");
});

// Fallback untuk testing: jika file tidak ada, gunakan URL online
window.addEventListener('load', function() {
  // Cek jika file audio gagal load setelah 3 detik
  setTimeout(() => {
  }, 3000);
});

// Tambahan: keyboard shortcuts
document.addEventListener('keydown', function(e) {
  switch(e.code) {
    case 'Space':
      e.preventDefault();
      playBtn.click();
      break;
    case 'ArrowRight':
      e.preventDefault);
      nextBtn.click();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      prevBtn.click();
      break;
  }
});
