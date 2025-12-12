<template>
  <ion-page class="custom-bg">
    <ion-header class="ion-no-border">
      <ion-toolbar class="transparent-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" class="back-btn"></ion-back-button>
        </ion-buttons>
        <ion-title class="page-title">Riwayat</ion-title>
        <ion-buttons slot="end">
          <div class="header-actions">
            <button @click="showFilter = !showFilter" class="header-circle-btn" :class="{ 'active': showFilter }">
              <ion-icon :icon="filter"></ion-icon>
            </button>
            <button @click="refreshData" class="header-circle-btn">
              <ion-icon :icon="refresh"></ion-icon>
            </button>
          </div>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <transition name="slide-fade">
        <div v-if="showFilter" class="pop-filter-panel">
          <div class="filter-grid">
            <div class="filter-item">
              <label>Tanggal</label>
              <div class="dt-btn-wrap">
                <ion-datetime-button datetime="filterDate"></ion-datetime-button>
                <ion-icon v-if="selectedDate" :icon="close" @click="clearDateFilter" class="clear-icon"></ion-icon>
              </div>
            </div>
            <div class="filter-item">
              <label>Kategori</label>
              <ion-select v-model="selectedCategory" interface="popover" placeholder="Semua" class="mini-select">
                <ion-select-option value="">Semua</ion-select-option>
                <ion-select-option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</ion-select-option>
              </ion-select>
            </div>
          </div>
        </div>
      </transition>

      <ion-modal :keep-contents-mounted="true">
        <ion-datetime id="filterDate" v-model="selectedDate" presentation="date" locale="id-ID"></ion-datetime>
      </ion-modal>

      <div class="container">
        <div class="stats-grid" v-if="filteredActivities.length > 0">
          <div class="stat-card blue-pop">
            <span class="stat-label">Total Aktivitas</span>
            <span class="stat-number">{{ filteredActivities.length }}</span>
          </div>
          <div class="stat-card indigo-pop">
            <span class="stat-label">Total Durasi</span>
            <span class="stat-number">{{ totalDurationFormatted }}</span>
          </div>
        </div>

        <div v-if="loading" class="center-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Mencari riwayat...</p>
        </div>

        <div v-else-if="filteredActivities.length === 0" class="empty-pop-state">
          <div class="empty-icon-box">
            <ion-icon :icon="timeOutline"></ion-icon>
          </div>
          <h3>Kosong nih..</h3>
          <p>Belum ada catatan aktivitas di sini.</p>
          <ion-button @click="goToAddActivity" class="add-btn-pop">Tambah Baru</ion-button>
        </div>

        <div v-else class="timeline-container">
          <div v-for="(group, date) in groupedActivities" :key="date" class="date-group">
            <div class="date-header">
              <div class="date-badge">{{ formatHeaderDate(date) }}</div>
              <div class="date-summary">{{ group.activities.length }} Sesi • {{ formatDuration(group.totalDuration) }}</div>
            </div>

            <div class="activity-stack">
              <div 
                v-for="activity in group.activities" 
                :key="activity.id" 
                class="history-item-card"
                @click="showActivityDetails(activity)"
              >
                <div class="item-left" :class="'bg-' + getCategoryColor(activity.category)">
                  <ion-icon :icon="getCategoryIcon(activity.category)"></ion-icon>
                </div>
                <div class="item-center">
                  <h4>{{ activity.title }}</h4>
                  <div class="item-info">
                    <span>{{ activity.formattedDuration }}</span>
                    <span class="dot">•</span>
                    <span class="cat-tag">{{ activity.category }}</span>
                  </div>
                </div>
                <div class="item-right">
                  {{ formatTime(activity.startTime) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-modal :is-open="showDetailModal" @did-dismiss="showDetailModal = false" class="detail-modal-pop">
      <div class="modal-pop-content" v-if="selectedActivity">
        <div class="modal-drag-handle"></div>
        <div class="modal-header">
          <div class="cat-icon-large" :class="'bg-' + getCategoryColor(selectedActivity.category)">
            <ion-icon :icon="getCategoryIcon(selectedActivity.category)"></ion-icon>
          </div>
          <h2>{{ selectedActivity.title }}</h2>
          <ion-badge :color="getCategoryColor(selectedActivity.category)">{{ selectedActivity.category }}</ion-badge>
        </div>

        <div class="detail-grid">
          <div class="detail-tile">
            <span class="tile-label">Tanggal</span>
            <span class="tile-val">{{ formatDetailDate(selectedActivity.date) }}</span>
          </div>
          <div class="detail-tile">
            <span class="tile-label">Durasi</span>
            <span class="tile-val">{{ selectedActivity.formattedDuration }}</span>
          </div>
          <div class="detail-tile">
            <span class="tile-label">Mulai</span>
            <span class="tile-val">{{ formatTime(selectedActivity.startTime) }}</span>
          </div>
          <div class="detail-tile">
            <span class="tile-label">Selesai</span>
            <span class="tile-val">{{ formatTime(selectedActivity.endTime) }}</span>
          </div>
        </div>

        <div v-if="selectedActivity.notes" class="notes-box">
          <label>CATATAN</label>
          <p>{{ selectedActivity.notes }}</p>
        </div>

        <div class="modal-footer">
          <ion-button expand="block" fill="clear" @click="showDetailModal = false" class="close-btn">Tutup</ion-button>
          <ion-button expand="block" color="danger" @click="deleteActivityWithConfirm(selectedActivity.id)" class="delete-btn-pop">
            <ion-icon :icon="trash" slot="start"></ion-icon>
            Hapus Aktivitas
          </ion-button>
        </div>
      </div>
    </ion-modal>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonButton, IonIcon, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonList, IonItem, IonLabel, IonNote, IonBadge,
  IonSpinner, IonSelect, IonSelectOption, IonDatetime, IonDatetimeButton, IonModal,
  IonItemDivider,
  alertController
} from '@ionic/vue';
import { 
  filter, refresh, close, timeOutline, add, 
  list, time, calendar, fitness, book, school, 
  briefcase, film, ellipsisHorizontal, trash
} from 'ionicons/icons';
import StorageService from '@/services/StorageService';
import { CATEGORIES } from '@/models/Activity';

const router = useRouter();

// State
const loading = ref(true);
const activities = ref([]);
const showFilter = ref(false);
const selectedDate = ref('');
const selectedCategory = ref('');
const showDetailModal = ref(false);
const selectedActivity = ref(null);

// Load activities
const loadActivities = async () => {
  try {
    loading.value = true;
    activities.value = await StorageService.getActivities();
    console.log('Loaded activities:', activities.value.length);
  } catch (error) {
    console.error('Error loading activities:', error);
  } finally {
    loading.value = false;
  }
};

// Filter activities
const filteredActivities = computed(() => {
  let filtered = [...activities.value];
  
  // Filter by date
  if (selectedDate.value) {
    const filterDate = new Date(selectedDate.value);
    filtered = filtered.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate.toDateString() === filterDate.toDateString();
    });
  }
  
  // Filter by category
  if (selectedCategory.value) {
    filtered = filtered.filter(activity => 
      activity.category === selectedCategory.value
    );
  }
  
  // Sort by date (newest first)
  return filtered.sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
});

// Group activities by date
const groupedActivities = computed(() => {
  const groups = {};
  
  filteredActivities.value.forEach(activity => {
    const dateKey = new Date(activity.date).toDateString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: new Date(activity.date),
        activities: [],
        totalDuration: 0
      };
    }
    
    groups[dateKey].activities.push(activity);
    groups[dateKey].totalDuration += activity.duration;
  });
  
  return groups;
});

// Total duration formatted
const totalDurationFormatted = computed(() => {
  const totalSeconds = filteredActivities.value.reduce((total, activity) => {
    return total + activity.duration;
  }, 0);
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  return `${hours}j ${minutes}m`;
});

// Format helpers
const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Hari Ini';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Kemarin';
  } else {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}j ${minutes}m`;
};

// Category helpers
const categories = CATEGORIES;

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

// Show activity details - PERBAIKAN
const showActivityDetails = (activity) => {
  console.log('Setting selected activity:', activity);
  selectedActivity.value = { ...activity }; // Create a copy to ensure reactivity
  console.log('Selected activity value:', selectedActivity.value);
  showDetailModal.value = true;
  console.log('Modal open:', showDetailModal.value);
};

// Delete activity with confirmation
const deleteActivityWithConfirm = async (id) => {
  const confirm = await alertController.create({
    header: 'Konfirmasi Hapus',
    message: 'Apakah Anda yakin ingin menghapus aktivitas ini?',
    buttons: [
      {
        text: 'Batal',
        role: 'cancel',
        cssClass: 'secondary'
      },
      {
        text: 'Hapus',
        role: 'destructive',
        cssClass: 'danger-button',
        handler: async () => {
          try {
            console.log('Deleting activity ID:', id);
            const success = await StorageService.deleteActivity(id);
            
            if (success) {
              showDetailModal.value = false;
              await loadActivities();

              // Dispatch event for other pages to update
              window.dispatchEvent(new CustomEvent('activity:changed', { detail: { action: 'delete', id } }));

              const successAlert = await alertController.create({
                header: 'Berhasil',
                message: 'Aktivitas berhasil dihapus',
                buttons: ['OK']
              });
              await successAlert.present();
            }
          } catch (error) {
            console.error('Error deleting activity:', error);
            const errorAlert = await alertController.create({
              header: 'Error',
              message: 'Gagal menghapus aktivitas',
              buttons: ['OK']
            });
            await errorAlert.present();
          }
        }
      }
    ]
  });
  
  await confirm.present();
};

// Format detail date
const formatDetailDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString || '-';
  }
};

// Clear date filter
const clearDateFilter = () => {
  selectedDate.value = '';
};

// Refresh data
const refreshData = () => {
  loadActivities();
};

// Navigate to add activity
const goToAddActivity = () => {
  router.push('/add-activity');
};

// Load data on mount
onMounted(() => {
  loadActivities();
});

// Tambahkan di dalam script setup
const formatHeaderDate = (dateString) => {
  const date = new Date(dateString);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  // Deteksi Hari Ini / Kemarin
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) return 'HARI INI';
  if (date.toDateString() === yesterday.toDateString()) return 'KEMARIN';
  
  return `${date.day} ${months[date.month]}`.toUpperCase();
};
</script>

<style scoped>
.custom-bg {
  --background: #F5F7FA;
}

.transparent-toolbar {
  --background: transparent;
  padding: 10px 16px;
}

.page-title {
  font-weight: 800;
  color: #2D3748;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-circle-btn {
  background: white;
  border: 1px solid #E2E8F0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #2D3748;
}

.header-circle-btn.active {
  background: #2D3748;
  color: white;
}

.container {
  padding: 0 20px 40px 20px;
}

/* Stats Bento */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 16px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
}

.blue-pop { background: #DBEAFE; color: #1E40AF; }
.indigo-pop { background: #E0E7FF; color: #4338CA; }

.stat-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; opacity: 0.8; }
.stat-number { font-size: 1.5rem; font-weight: 900; margin-top: 4px; }

/* Filter Panel */
.pop-filter-panel {
  background: white;
  margin: 0 16px 16px 16px;
  padding: 16px;
  border-radius: 20px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
}

.filter-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
}

.filter-item label {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
  margin-bottom: 6px;
  color: #718096;
}

.dt-btn-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.clear-icon { color: #E53E3E; font-size: 18px; }

/* Timeline Grouping */
.date-group {
  margin-bottom: 32px;
}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.date-badge {
  background: #2D3748;
  color: white;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 900;
}

.date-summary {
  font-size: 0.75rem;
  font-weight: 700;
  color: #718096;
}

/* History Card */
.history-item-card {
  background: white;
  padding: 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  transition: transform 0.2s;
}

.history-item-card:active { transform: scale(0.98); }

.item-left {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.item-center h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #2D3748;
}

.item-info {
  font-size: 0.8rem;
  color: #718096;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot { font-size: 14px; color: #CBD5E0; }

.item-right {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 700;
  color: #A0AEC0;
}

/* Category Colors */
.bg-success { background: #D1FAE5; color: #059669; }
.bg-primary { background: #DBEAFE; color: #2563EB; }
.bg-tertiary { background: #EDE9FE; color: #7C3AED; }
.bg-warning { background: #FEF3C7; color: #D97706; }
.bg-danger { background: #FCE7F3; color: #DB2777; }

/* Detail Modal Pop */
.detail-modal-pop {
  --height: auto;
  --border-radius: 32px 32px 0 0;
  align-items: flex-end;
}

.modal-pop-content {
  padding: 24px;
  background: white;
}

.modal-drag-handle {
  width: 40px;
  height: 5px;
  background: #E2E8F0;
  border-radius: 10px;
  margin: 0 auto 24px auto;
}

.modal-header {
  text-align: center;
  margin-bottom: 24px;
}

.cat-icon-large {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  margin: 0 auto 16px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.modal-header h2 { font-weight: 900; margin: 0 0 8px 0; font-size: 1.5rem; }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.detail-tile {
  background: #F7FAFC;
  padding: 12px;
  border-radius: 16px;
}

.tile-label { display: block; font-size: 0.65rem; font-weight: 800; color: #A0AEC0; text-transform: uppercase; margin-bottom: 4px; }
.tile-val { font-size: 0.9rem; font-weight: 700; color: #2D3748; }

.notes-box {
  background: #FFF9E6;
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 24px;
}

.notes-box label { font-size: 0.65rem; font-weight: 900; color: #B7791F; display: block; margin-bottom: 6px; }
.notes-box p { margin: 0; font-style: italic; font-size: 0.9rem; color: #744210; }

.delete-btn-pop {
  --background: #FEE2E2;
  --color: #B91C1C;
  --border-radius: 16px;
  font-weight: 800;
  margin-top: 8px;
}

/* Animations */
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(-20px); opacity: 0; }
</style>