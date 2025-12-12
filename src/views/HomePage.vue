<template>
  <ion-page class="main-bg">
    <ion-header class="ion-no-border">
      <ion-toolbar class="clear-toolbar">
        <div class="header-wrapper">
          <div class="user-info">
            <h1 class="welcome-text">Halo, Fatim👋</h1>
            <p class="user-id">Tracker H1D023019</p>
          </div>
          <div class="nav-buttons">
            <button class="glass-icon-btn" @click="goToHistory">
              <ion-icon :icon="time"></ion-icon>
            </button>
            <button class="glass-icon-btn" @click="goToStatistics">
              <ion-icon :icon="statsChart"></ion-icon>
            </button>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding-horizontal">
      <div class="timer-hub-premium">
        <div class="hub-glow"></div>
        <div class="timer-content-wrapper">
          <div class="status-pill-dark">
            <div class="pulse-dot-white"></div>
            <span>FOCUS MODE</span>
          </div>
          <div class="timer-controls-container">
             <TimerComponent ref="timerRef" @save-session="saveWithTimer" />
          </div>
        </div>
      </div>

      <div class="bento-container">
         <div class="bento-item blue-soft">
          <ion-icon :icon="list" class="bento-icon"></ion-icon>
          <div class="bento-data">
            <span class="bento-val">{{ todayActivities.length }}</span>
            <span class="bento-title">Aktivitas</span>
          </div>
        </div>
        <div class="bento-item green-soft">
          <ion-icon :icon="time" class="bento-icon"></ion-icon>
          <div class="bento-data">
            <span class="bento-val">{{ totalDurationFormatted }}</span>
            <span class="bento-title">Durasi</span>
          </div>
        </div>
      </div>
      
      <div class="section-title-row">
        <h3>Aktivitas Terbaru</h3>
        <ion-button fill="clear" @click="goToHistory" class="view-all-text">Lihat Semua</ion-button>
      </div>
      
      <div v-if="!loading && todayActivities.length > 0" class="modern-list">
        <div v-for="activity in todayActivities.slice(0, 3)" :key="activity.id" class="activity-card-row">
          <div class="card-leading" :class="'color-' + getCategoryColor(activity.category)">
            <ion-icon :icon="getCategoryIcon(activity.category)"></ion-icon>
          </div>
          <div class="card-content">
            <h4>{{ activity.title }}</h4>
            <p>{{ activity.category }} • {{ activity.formattedDuration }}</p>
          </div>
          <div class="card-trailing">
            {{ activity.formattedTime }}
          </div>
        </div>
      </div>
       <div class="bottom-spacer"></div>
    </ion-content>

    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button class="main-fab" @click="goToAddActivity">
        <ion-icon :icon="add"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonButton, IonIcon, IonCard, IonCardHeader, 
  IonCardTitle, IonCardSubtitle, IonCardContent, IonList, 
  IonItem, IonLabel, IonNote, IonFab, IonFabButton, IonSpinner
} from '@ionic/vue';
import { 
  time, statsChart, save, calendar, list, 
  add, arrowForward, fitness, book, school, 
  briefcase, film, ellipsisHorizontal 
} from 'ionicons/icons';
import TimerComponent from '@/components/TimerComponent.vue';
import StorageService from '@/services/StorageService';
import { Activity, CATEGORIES } from '@/models/Activity';

const router = useRouter();
const timerRef = ref(null);
const loading = ref(true);
const todayActivities = ref([]);


const quickCategories = [
  { id: 'olahraga', name: 'Olahraga', icon: fitness },
  { id: 'membaca', name: 'Membaca', icon: book },
  { id: 'belajar', name: 'Belajar', icon: school },
  { id: 'bekerja', name: 'Bekerja', icon: briefcase }
];


const todayDate = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});


const totalDurationFormatted = computed(() => {
  const totalSeconds = todayActivities.value.reduce((total, activity) => {
    return total + activity.duration;
  }, 0);
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  return `${hours}j ${minutes}m`;
});


const loadTodayActivities = async () => {
  try {
    loading.value = true;
    const activities = await StorageService.getActivitiesByDate(new Date());
    todayActivities.value = activities.sort((a, b) => 
      new Date(b.startTime) - new Date(a.startTime)
    );
  } catch (error) {
    console.error('Error loading activities:', error);
  } finally {
    loading.value = false;
  }
};


const goToAddActivity = () => {
  router.push('/add-activity');
};

const goToHistory = () => {
  router.push('/history');
};

const goToStatistics = () => {
  router.push('/statistics');
};


const saveWithTimer = () => {
  if (timerRef.value && timerRef.value.elapsedSeconds > 0) {
    router.push({
      path: '/add-activity',
      query: { timerDuration: timerRef.value.elapsedSeconds }
    });
  } else {

    console.log('Timer belum dimulai atau durasi 0');
  }
};


const quickAdd = (category) => {
  const activity = new Activity({
    title: `${category.name} ${new Date().getHours()}:${new Date().getMinutes()}`,
    category: category.name,
    duration: 1800, 
    notes: 'Ditambahkan via quick add'
  });
  

  router.push({
    path: '/add-activity',
    query: { 
      title: activity.title,
      category: activity.category,
      duration: activity.duration
    }
  });
};


const getCategoryIcon = (category) => {
  const icons = {
    'Olahraga': fitness,
    'Membaca': book,
    'Belajar': school,
    'Bekerja': briefcase,
    'Hiburan': film
  };
  return icons[category] || ellipsisHorizontal;
};

const getCategoryColor = (category) => {
  const colors = {
    'Olahraga': 'success',
    'Membaca': 'primary',
    'Belajar': 'tertiary',
    'Bekerja': 'warning',
    'Hiburan': 'danger'
  };
  return colors[category] || 'medium';
};


const onActivityChanged = (event) => {
  console.log('Activity changed event received:', event);
  loadTodayActivities();
};

onMounted(() => {
  loadTodayActivities();
  window.addEventListener('activity:changed', onActivityChanged);
});

onUnmounted(() => {
  window.removeEventListener('activity:changed', onActivityChanged);
});
</script>

<style scoped>

.main-bg {
  --background: #FFFFFF; 
}

.container {
  padding: 0 20px 120px 20px;
}


.clear-toolbar {
  --background: #FFFFFF;
  --border-width: 0;
  padding: 15px 20px 5px 20px; 
}

.header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}


.welcome-text {
  font-size: 1.8rem; 
  font-weight: 900;
  color: #0F172A;
  margin: 0;
  letter-spacing: -1px;
}


.user-id {
  font-size: 0.85rem; 
  font-weight: 300;
  color: #64748B; 
  margin: 2px 0 0 0;
  letter-spacing: 0.5px;
}

.nav-buttons {
  display: flex;
  gap: 10px;
}

.glass-icon-btn {
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  color: #475569;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.glass-icon-btn:active {
  transform: scale(0.9);
  background: #F1F5F9;
}


.timer-hub-premium {
  position: relative;
  background: linear-gradient(145deg, #1E293B 0%, #0F172A 100%);
  border-radius: 40px;
  padding: 35px 24px;
  margin-top: 15px;
  box-shadow: 0 25px 40px -15px rgba(15, 23, 42, 0.25);
  overflow: hidden;
}

.hub-glow {
  position: absolute;
  top: -50%; left: -50%; width: 200%; height: 200%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(0,0,0,0) 70%);
  pointer-events: none;
}

.status-pill-dark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.08);
  padding: 6px 14px;
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.pulse-dot-white {
  width: 6px; height: 6px;
  background: #60A5FA;
  border-radius: 50%;
  box-shadow: 0 0 10px #60A5FA;
  animation: pulse-white 2s infinite;
}

@keyframes pulse-white {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}


.bento-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 25px;
}

.bento-item {
  padding: 22px 18px;
  border-radius: 26px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.02);
}

.blue-soft { background-color: #F0F7FF; color: #3B82F6; }
.green-soft { background-color: #F0FDF4; color: #22C55E; }

.bento-val {
  display: block;
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -1px;
}

.bento-title {
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0.6;
}


.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 35px;
  margin-bottom: 12px;
}

.section-title-row h3 {
  font-size: 1.15rem;
  font-weight: 900;
  color: #1E293B;
  margin: 0;
}

.view-all-text {
  --color: #6366F1;
  font-weight: 800;
  font-size: 0.8rem;
}

.activity-card-row {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  padding: 14px;
  border-radius: 22px;
  margin-bottom: 10px;
  border: 1px solid #F8FAFC;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.015);
}

.card-leading {
  width: 46px; height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center; justify-content: center;
  font-size: 22px;
  margin-right: 14px;
}

.color-success { background: #DCFCE7; color: #16A34A; }
.color-primary { background: #DBEAFE; color: #2563EB; }
.color-tertiary { background: #F3E8FF; color: #9333EA; }
.color-warning { background: #FEF9C3; color: #CA8A04; }
.color-danger { background: #FFE4E6; color: #E11D48; }

.card-content h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #334155;
}

.card-content p {
  margin: 2px 0 0 0;
  font-size: 0.7rem;
  color: #94A3B8;
  font-weight: 700;
}

.card-trailing {
  margin-left: auto;
  font-size: 0.7rem;
  font-weight: 800;
  color: #CBD5E1;
}

.main-fab {
  --background: #0F172A;
  --background-activated: #1E293B;
  --color: #FFFFFF;
  --border-radius: 18px;
  box-shadow: 0 15px 30px -5px rgba(15, 23, 42, 0.3);
}

.bottom-spacer {
  height: 100px;
}
</style>
