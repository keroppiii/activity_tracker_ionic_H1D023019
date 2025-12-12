<template>
  <ion-page class="custom-bg">
    <ion-header class="ion-no-border">
      <ion-toolbar class="transparent-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" class="back-btn"></ion-back-button>
        </ion-buttons>
        <ion-title class="page-title">Statistik</ion-title>
        <ion-buttons slot="end">
          <button @click="refreshData" class="header-circle-btn">
            <ion-icon :icon="refresh"></ion-icon>
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="container">
        <div class="period-container">
          <ion-segment v-model="selectedPeriod" @ionChange="loadStatistics" mode="ios" class="custom-segment">
            <ion-segment-button value="today"><ion-label>Hari Ini</ion-label></ion-segment-button>
            <ion-segment-button value="week"><ion-label>Minggu</ion-label></ion-segment-button>
            <ion-segment-button value="month"><ion-label>Bulan</ion-label></ion-segment-button>
            <ion-segment-button value="all"><ion-label>Semua</ion-label></ion-segment-button>
          </ion-segment>
        </div>

        <div v-if="loading" class="center-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Menganalisis data...</p>
        </div>

        <div v-else-if="!hasData" class="empty-pop-state">
          <div class="empty-icon-box">
            <ion-icon :icon="statsChart"></ion-icon>
          </div>
          <h3>Belum ada data</h3>
          <p>Yuk, catat aktivitasmu untuk melihat statistik di sini!</p>
          <ion-button @click="goToAddActivity" class="add-btn-pop">Tambah Aktivitas</ion-button>
        </div>

        <div v-else class="stats-content">
          
          <div class="bento-grid">
            <div class="bento-item blue-pop">
              <span class="bento-label">Total Sesi</span>
              <span class="bento-val">{{ statistics.totalActivities }}</span>
              <ion-icon :icon="list" class="bento-icon"></ion-icon>
            </div>
            <div class="bento-item green-pop">
              <span class="bento-label">Total Waktu</span>
              <span class="bento-val">{{ formatDuration(statistics.totalDuration) }}</span>
              <ion-icon :icon="time" class="bento-icon"></ion-icon>
            </div>
            <div class="bento-item indigo-pop full-width">
              <div class="avg-content">
                <ion-icon :icon="trendingUp"></ion-icon>
                <span>Rata-rata durasi per sesi: <strong>{{ averageDuration }}</strong></span>
              </div>
            </div>
          </div>

          <div class="section-header">
            <h2>Distribusi Kategori</h2>
          </div>
          <div class="chart-container-pop">
            <ActivityChart type="doughnut" :data="categoryChartData" />
            <div class="custom-legend">
              <div v-for="(item, index) in categoryChartData.labels" :key="index" class="legend-pop-item">
                <span class="dot" :style="{ backgroundColor: categoryChartData.colors[index] }"></span>
                <span class="label">{{ item }}</span>
                <span class="value">{{ categoryChartData.values[index] }}{{ selectedPeriod === 'today' ? '' : 'j' }}</span>
              </div>
            </div>
          </div>

          <div class="section-header">
            <h2>Aktivitas Harian (7 Hari Terakhir)</h2>
          </div>
          <div class="chart-container-pop bar-chart-wrap">
            <ActivityChart type="bar" :data="dailyChartData" :options="barChartOptions" />
          </div>

          <div class="section-header">
            <h2>Top Kategori</h2>
          </div>
          <div class="ranking-list">
            <div v-for="(category, index) in topCategories" :key="category.name" class="rank-card">
              <div class="rank-number" :class="'rank-' + (index + 1)">{{ index + 1 }}</div>
              <div class="rank-icon" :class="'icon-bg-' + getCategoryColor(category.name)">
                <ion-icon :icon="getCategoryIcon(category.name)"></ion-icon>
              </div>
              <div class="rank-info">
                <h4>{{ category.name }}</h4>
                <p>{{ category.count }} Sesi • {{ formatDuration(category.duration) }}</p>
              </div>
              <div class="rank-percent">{{ category.percentage }}%</div>
            </div>
          </div>

          <div class="section-header">
            <h2>Terbaru</h2>
          </div>
          <div class="recent-list">
            <div v-for="activity in recentActivities" :key="activity.id" class="mini-history-card">
              <div class="mini-dot" :class="'bg-' + getCategoryColor(activity.category)"></div>
              <div class="mini-body">
                <span class="mini-title">{{ activity.title }}</span>
                <span class="mini-meta">{{ formatDate(activity.date) }} • {{ activity.formattedDuration }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
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
  IonSpinner, IonSegment, IonSegmentButton,
  alertController
} from '@ionic/vue';
import { 
  refresh, add, statsChart, list, time, trendingUp,
  pieChart, barChart, trophy, calendar, fitness, book, 
  school, briefcase, film, ellipsisHorizontal
} from 'ionicons/icons';
import ActivityChart from '@/components/ActivityChart.vue';
import StorageService from '@/services/StorageService';
import { CATEGORIES } from '@/models/Activity';

const router = useRouter();

// State
const loading = ref(true);
const selectedPeriod = ref('today');
const statistics = ref({
  totalActivities: 0,
  totalDuration: 0,
  categoryStats: {},
  activities: []
});

// Load statistics
const loadStatistics = async () => {
  try {
    loading.value = true;
    
    // Get activities based on selected period
    const allActivities = await StorageService.getActivities();
    let filteredActivities = [...allActivities];
    
    // Filter by period
    const now = new Date();
    if (selectedPeriod.value === 'today') {
      filteredActivities = filteredActivities.filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate.toDateString() === now.toDateString();
      });
    } else if (selectedPeriod.value === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredActivities = filteredActivities.filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate >= weekAgo;
      });
    } else if (selectedPeriod.value === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filteredActivities = filteredActivities.filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate >= monthAgo;
      });
    }
    // 'all' uses all activities
    
    // Calculate statistics
    const totalDuration = filteredActivities.reduce((total, activity) => {
      return total + (activity.duration || 0);
    }, 0);
    
    // Category statistics
    const categoryStats = {};
    filteredActivities.forEach(activity => {
      if (!categoryStats[activity.category]) {
        categoryStats[activity.category] = {
          count: 0,
          duration: 0,
          color: StorageService.getCategoryColor(activity.category)
        };
      }
      categoryStats[activity.category].count++;
      categoryStats[activity.category].duration += activity.duration;
    });
    
    statistics.value = {
      totalActivities: filteredActivities.length,
      totalDuration,
      categoryStats,
      activities: filteredActivities.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      )
    };
    
  } catch (error) {
    console.error('Error loading statistics:', error);
    
    const alert = await alertController.create({
      header: 'Error',
      message: 'Gagal memuat statistik',
      buttons: ['OK']
    });
    await alert.present();
    
  } finally {
    loading.value = false;
  }
};

// Computed properties
const hasData = computed(() => {
  return statistics.value.totalActivities > 0;
});

const averageDuration = computed(() => {
  if (statistics.value.totalActivities === 0) return '0j 0m';
  const avgSeconds = statistics.value.totalDuration / statistics.value.totalActivities;
  return formatDuration(avgSeconds);
});

const topCategories = computed(() => {
  const categories = Object.entries(statistics.value.categoryStats).map(([name, data]) => ({
    name,
    count: data.count,
    duration: data.duration,
    percentage: ((data.count / statistics.value.totalActivities) * 100).toFixed(1)
  }));
  
  return categories.sort((a, b) => b.count - a.count).slice(0, 5);
});

const recentActivities = computed(() => {
  return statistics.value.activities.slice(0, 5);
});

// Chart data
const categoryChartData = computed(() => {
  const labels = [];
  const values = [];
  const colors = [];
  
  Object.entries(statistics.value.categoryStats).forEach(([category, data]) => {
    labels.push(category);
    values.push(selectedPeriod.value === 'today' ? data.count : Math.round(data.duration / 3600));
    colors.push(data.color || '#607D8B');
  });
  
  return { labels, values, colors };
});

const dailyChartData = computed(() => {
  // Group activities by day for the last 7 days
  const dailyCounts = {};
  const now = new Date();
  
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toLocaleDateString('id-ID', { weekday: 'short' });
    dailyCounts[dateKey] = 0;
  }
  
  // Count activities per day
  statistics.value.activities.forEach(activity => {
    const activityDate = new Date(activity.date);
    const dateKey = activityDate.toLocaleDateString('id-ID', { weekday: 'short' });
    
    // Only include last 7 days
    const daysDiff = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24));
    if (daysDiff >= 0 && daysDiff <= 6) {
      if (dailyCounts[dateKey] !== undefined) {
        dailyCounts[dateKey]++;
      }
    }
  });
  
  return {
    labels: Object.keys(dailyCounts),
    datasets: [{
      label: 'Jumlah Aktivitas',
      data: Object.values(dailyCounts),
      backgroundColor: 'rgba(76, 175, 80, 0.6)',
      borderColor: 'rgba(76, 175, 80, 1)'
    }]
  };
});

const barChartOptions = {
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  }
};

// Helper functions
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}j ${minutes}m`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit'
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

const getRankColor = (index) => {
  const colors = ['primary', 'secondary', 'tertiary', 'success', 'medium'];
  return colors[index] || 'medium';
};

// Navigation
const goToAddActivity = () => {
  router.push('/add-activity');
};

const refreshData = () => {
  loadStatistics();
};

// Load data on mount
onMounted(() => {
  loadStatistics();
});
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

.back-btn { --color: #2D3748; }

.header-circle-btn {
  background: white;
  border: 1px solid #E2E8F0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: #2D3748;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  padding: 0 20px 40px 20px;
}

/* Period Selector */
.period-container {
  margin-bottom: 24px;
}

.custom-segment {
  --background: #EDF2F7;
  padding: 4px;
  border-radius: 16px;
}

.custom-segment ion-segment-button {
  --indicator-color: white;
  --color: #718096;
  --color-checked: #2D3748;
  font-weight: 700;
  font-size: 0.8rem;
}

/* Bento Grid */
.bento-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 32px;
}

.bento-item {
  padding: 20px;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.full-width { grid-column: span 2; padding: 16px 20px; }

.blue-pop { background: #DBEAFE; color: #1E40AF; }
.green-pop { background: #D6F5E1; color: #065F46; }
.indigo-pop { background: #E0E7FF; color: #4338CA; }

.bento-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; opacity: 0.8; }
.bento-val { font-size: 1.6rem; font-weight: 900; margin-top: 4px; }

.bento-icon {
  position: absolute;
  right: -10px;
  bottom: -10px;
  font-size: 60px;
  opacity: 0.15;
}

.avg-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Charts */
.section-header { margin: 32px 0 16px 0; }
.section-header h2 { font-size: 1.1rem; font-weight: 800; color: #2D3748; margin: 0; }

.chart-container-pop {
  background: white;
  padding: 24px;
  border-radius: 28px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.custom-legend {
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.legend-pop-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 700;
}

.legend-pop-item .dot { width: 8px; height: 8px; border-radius: 50%; }
.legend-pop-item .value { margin-left: auto; color: #A0AEC0; }

/* Ranking List */
.rank-card {
  background: white;
  padding: 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rank-number {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 0.75rem;
}

.rank-1 { background: #FEF3C7; color: #D97706; } /* Gold */
.rank-2 { background: #E2E8F0; color: #475569; } /* Silver */
.rank-3 { background: #FFEDD5; color: #9A3412; } /* Bronze */

.rank-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.rank-info { flex: 1; }
.rank-info h4 { margin: 0; font-size: 0.9rem; font-weight: 800; }
.rank-info p { margin: 0; font-size: 0.75rem; color: #718096; font-weight: 600; }

.rank-percent { font-weight: 900; color: #2D3748; font-size: 0.9rem; }

/* Recent Log */
.mini-history-card {
  background: white;
  padding: 12px 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.mini-dot { width: 10px; height: 10px; border-radius: 50%; }
.mini-body { display: flex; flex-direction: column; }
.mini-title { font-size: 0.85rem; font-weight: 700; color: #2D3748; }
.mini-meta { font-size: 0.7rem; color: #A0AEC0; font-weight: 600; }

/* Colors Helper */
.bg-success { background: #D1FAE5; color: #059669; }
.bg-primary { background: #DBEAFE; color: #2563EB; }
.bg-tertiary { background: #EDE9FE; color: #7C3AED; }
.bg-warning { background: #FEF3C7; color: #D97706; }
.bg-danger { background: #FCE7F3; color: #DB2777; }

.icon-bg-success { background: #D1FAE5; color: #10B981; }
.icon-bg-primary { background: #DBEAFE; color: #3B82F6; }
.icon-bg-tertiary { background: #EDE9FE; color: #8B5CF6; }
.icon-bg-warning { background: #FEF3C7; color: #F59E0B; }
.icon-bg-danger { background: #FCE7F3; color: #EC4899; }

/* States */
.center-state { text-align: center; padding: 60px 0; color: #718096; }
.empty-pop-state {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 32px;
  border: 2px dashed #E2E8F0;
}
.empty-icon-box { font-size: 64px; color: #CBD5E0; margin-bottom: 16px; }
.add-btn-pop { --background: #000; --border-radius: 12px; margin-top: 20px; font-weight: 700; }
</style>