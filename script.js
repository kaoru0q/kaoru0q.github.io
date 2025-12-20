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
  },
];

let currentSongIndex = 0;
let isAudioEnabled = false;
let repeatMode = 'off'; // 'off', 'all', 'one'
let autoplayEnabled = true;

// DOM Elements
const audio = document.getElementById('audio');
const playBtn = document.getElementById('play');
const nextBtn = document.getElementById('next');
const prevBtn = document.getElementById('prev');
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
