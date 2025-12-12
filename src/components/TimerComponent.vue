<template>
  <div class="timer-wrapper">
    <div class="display-section">
      <h2 class="timer-digits">{{ formattedTime }}</h2>
      <div class="status-indicator">
        <span :class="['dot', { 'pulse': isRunning }]"></span>
        <span class="status-label">{{ isRunning ? 'Sesi Sedang Berjalan' : 'Timer Berhenti' }}</span>
      </div>
    </div>
    
    <div class="control-row">
      <button class="icon-circle-btn" @click="resetTimer">
        <ion-icon :icon="refresh"></ion-icon>
      </button>
      
      <button 
        :class="['main-action-pill', isRunning ? 'pause-mode' : 'play-mode']" 
        @click="isRunning ? pauseTimer() : startTimer()"
      >
        <ion-icon :icon="isRunning ? pause : play"></ion-icon>
        <span>{{ isRunning ? 'Pause' : 'Start' }}</span>
      </button>

      <button class="icon-circle-btn save-btn-alt" @click="$emit('save-session')">
        <ion-icon :icon="save"></ion-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { IonIcon } from '@ionic/vue';
import { play, pause, refresh, save } from 'ionicons/icons';

const isRunning = ref(false);
const elapsedSeconds = ref(0);
let timerInterval = null;

const formattedTime = computed(() => {
  const hours = Math.floor(elapsedSeconds.value / 3600);
  const minutes = Math.floor((elapsedSeconds.value % 3600) / 60);
  const seconds = elapsedSeconds.value % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

const startTimer = () => {
  if (!isRunning.value) {
    isRunning.value = true;
    timerInterval = setInterval(() => { elapsedSeconds.value++; }, 1000);
  }
};

const pauseTimer = () => {
  if (isRunning.value) {
    isRunning.value = false;
    clearInterval(timerInterval);
  }
};

const resetTimer = () => {
  isRunning.value = false;
  elapsedSeconds.value = 0;
  clearInterval(timerInterval);
};

defineExpose({ elapsedSeconds, isRunning, formattedTime, startTimer, pauseTimer, resetTimer });
onUnmounted(() => { clearInterval(timerInterval); });
</script>

<style scoped>
.timer-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.timer-digits {
  font-size: 4rem;
  font-weight: 800;
  color: white;
  margin: 0;
  font-family: 'Inter', sans-serif;
  letter-spacing: -1px;
}

.status-label {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
}


.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Menjaga jarak antar elemen */
  width: 100%;
  max-width: 280px; /* Batasi lebar agar tidak terlalu melar */
  margin-top: 35px;
}


.icon-circle-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}


.main-action-pill {
  height: 55px;
  padding: 0 25px;
  border-radius: 30px;
  border: none;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 1rem;
  color: #0F172A; /* Teks Gelap agar Pop-out */
  background: white; /* Putih bersih seperti contoh Flutter */
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.main-action-pill ion-icon {
  font-size: 20px;
}

.icon-circle-btn:active, .main-action-pill:active {
  transform: scale(0.92);
}

.save-btn-alt {
  color: #60A5FA; /* Beri aksen biru pada ikon simpan */
}

@media (max-width: 576px) {
  .timer-digits { font-size: 3.5rem; }
  .main-action-pill { padding: 0 20px; height: 50px; }
}
</style>