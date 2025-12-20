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

let index = 0;
let audioContext;
let isAudioUnlocked = false;
let wasPlaying = false; // Untuk track apakah sebelumnya sedang play

// DOM Elements
const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
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
    if (audio.error || !audio.src) {
      console.log("Using demo audio URLs...");
      
      // Ganti dengan demo URLs
      songs[0].src = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      songs[1].src = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
      songs[2].src = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3";
      
      // Load ulang song saat ini
      loadSong(index).then(() => {
        console.log("Demo songs loaded");
      });
    }
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
      e.preventDefault();
      nextBtn.click();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      prevBtn.click();
      break;
  }
});
