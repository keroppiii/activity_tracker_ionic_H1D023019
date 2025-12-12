<template>
  <ion-page class="custom-bg">
    <ion-header class="ion-no-border">
      <ion-toolbar class="transparent-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" class="back-btn"></ion-back-button>
        </ion-buttons>
        <ion-title class="page-title">Aktivitas Baru</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="container">
        <form @submit.prevent="saveActivity">
          
          <div class="input-group">
            <label class="section-label">Mau ngapain?</label>
            <div class="pop-input-card">
              <ion-icon :icon="addIcon" class="input-icon"></ion-icon>
              <ion-input 
                v-model="activity.title" 
                placeholder="Misal: Jogging Sore"
                class="main-input"
              ></ion-input>
            </div>
          </div>

          <div class="input-group">
            <label class="section-label">Kategori</label>
            <div class="pop-input-card">
              <ion-icon :icon="getCategoryIcon(activity.category)" class="input-icon" :style="{color: getCategoryColorHex(activity.category)}"></ion-icon>
              <ion-select 
                v-model="activity.category" 
                interface="popover" 
                placeholder="Pilih Kategori"
                class="main-select"
              >
                <ion-select-option v-for="cat in categories" :key="cat.id" :value="cat.name">
                  {{ cat.name }}
                </ion-select-option>
              </ion-select>
            </div>
          </div>

          <div class="input-group">
            <label class="section-label">Berapa lama?</label>
            <div class="duration-pop-card">
              <div class="timer-display">
                {{ formattedDuration }}
              </div>
              
              <div class="duration-controls-row">
                <div class="control-box">
                  <span class="unit-label">Jam</span>
                  <div class="btn-wrap">
                    <button type="button" @click="adjustDuration(-3600)" class="circle-step-btn"><ion-icon :icon="remove"></ion-icon></button>
                    <span class="val">{{ hours }}</span>
                    <button type="button" @click="adjustDuration(3600)" class="circle-step-btn"><ion-icon :icon="addIcon"></ion-icon></button>
                  </div>
                </div>
                <div class="control-box">
                  <span class="unit-label">Menit</span>
                  <div class="btn-wrap">
                    <button type="button" @click="adjustDuration(-300)" class="circle-step-btn"><ion-icon :icon="remove"></ion-icon></button>
                    <span class="val">{{ minutes }}</span>
                    <button type="button" @click="adjustDuration(300)" class="circle-step-btn"><ion-icon :icon="addIcon"></ion-icon></button>
                  </div>
                </div>
              </div>

              <div class="quick-pills">
                <div 
                  v-for="quick in quickDurations" 
                  :key="quick.label" 
                  @click="setDuration(quick.seconds)"
                  class="pill-chip"
                >
                  {{ quick.label }}
                </div>
              </div>
            </div>
          </div>

          <div class="input-group">
            <label class="section-label">Catatan (Opsional)</label>
            <div class="pop-input-card textarea-card">
              <ion-textarea 
                v-model="activity.notes" 
                rows="3"
                placeholder="Tulis detailnya di sini..."
              ></ion-textarea>
            </div>
          </div>

          <div class="input-group">
            <label class="section-label">Kapan dilakukan?</label>
            <div class="datetime-pop-grid">
              <div class="dt-card">
                <ion-icon :icon="calendar"></ion-icon>
                <ion-datetime-button datetime="datePicker"></ion-datetime-button>
              </div>
              <div class="dt-card">
                <ion-icon :icon="time"></ion-icon>
                <ion-datetime-button datetime="timePicker"></ion-datetime-button>
              </div>
            </div>
          </div>

          <div class="action-footer">
            <ion-button type="submit" expand="block" class="main-save-btn" :disabled="!formValid">
              <ion-icon :icon="save" slot="start"></ion-icon>
              Simpan Aktivitas
            </ion-button>
            <ion-button @click="resetForm" fill="clear" class="reset-link-btn">
              Reset Form
            </ion-button>
          </div>
        </form>
      </div>

      <ion-modal :keep-contents-mounted="true">
        <ion-datetime id="datePicker" v-model="activityDate" presentation="date" locale="id-ID"></ion-datetime>
      </ion-modal>
      <ion-modal :keep-contents-mounted="true">
        <ion-datetime id="timePicker" v-model="activityTime" presentation="time" locale="id-ID"></ion-datetime>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonButton, IonIcon, IonBackButton, 
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonTextarea, IonDatetime, IonDatetimeButton, IonModal
} from '@ionic/vue';
import { 
  save, time, add as addIcon, remove, refresh,
  fitness, book, school, briefcase, film, ellipsisHorizontal
} from 'ionicons/icons';
import { Activity, CATEGORIES } from '@/models/Activity';
import StorageService from '@/services/StorageService';

const router = useRouter();
const route = useRoute();


const activity = ref(new Activity());
const activityDate = ref(new Date().toISOString());
const activityTime = ref(new Date().toISOString());


const categories = CATEGORIES;


const quickDurations = [
  { label: '15 menit', seconds: 900 },
  { label: '30 menit', seconds: 1800 },
  { label: '1 jam', seconds: 3600 },
  { label: '2 jam', seconds: 7200 }
];


const hours = computed(() => Math.floor(activity.value.duration / 3600));
const minutes = computed(() => Math.floor((activity.value.duration % 3600) / 60));
const seconds = computed(() => activity.value.duration % 60);

const formattedDuration = computed(() => {
  return `${hours.value.toString().padStart(2, '0')}:${
    minutes.value.toString().padStart(2, '0')}:${
    seconds.value.toString().padStart(2, '0')}`;
});


const formValid = computed(() => {
  return activity.value.title.trim() !== '' && 
         activity.value.category !== '' && 
         activity.value.duration > 0;
});


onMounted(() => {
  
  if (route.query.timerDuration) {
    const timerSeconds = parseInt(route.query.timerDuration);
    if (timerSeconds > 0) {
      activity.value.duration = timerSeconds;
      activity.value.title = 'Aktivitas dengan Timer';
    }
  }

 
  if (route.query.title) {
    activity.value.title = route.query.title;
  }
  if (route.query.category) {
    activity.value.category = route.query.category;
  }
  if (route.query.duration) {
    activity.value.duration = parseInt(route.query.duration);
  }

 
  const now = new Date();
  activityDate.value = now.toISOString();
  activityTime.value = now.toISOString();
});


const adjustDuration = (seconds) => {
  const newDuration = activity.value.duration + seconds;
  if (newDuration >= 0) {
    activity.value.duration = newDuration;
  }
};


const setDuration = (seconds) => {
  activity.value.duration = seconds;
};


const saveActivity = async () => {
  if (!formValid.value) {
    console.warn('Form tidak valid');
    return;
  }

  try {
    console.log('=== SAVE ACTIVITY START ===');
    
    
    const date = new Date(activityDate.value);
    const time = new Date(activityTime.value);
    
    date.setHours(time.getHours());
    date.setMinutes(time.getMinutes());
    date.setSeconds(time.getSeconds());

    const activityData = {
      id: activity.value.id || `activity_${Date.now()}`,
      title: activity.value.title,
      category: activity.value.category,
      duration: activity.value.duration,
      notes: activity.value.notes || '',
      date: date.toISOString(),
      startTime: date.toISOString(),
      endTime: new Date(date.getTime() + (activity.value.duration * 1000)).toISOString()
    };

    console.log('📦 Activity data to save:', activityData);
    
    
    const saved = await StorageService.saveActivity(activityData);
    console.log('✅ Save result:', saved);
    
    
    const alert = document.createElement('ion-alert');
    alert.header = 'Berhasil!';
    alert.message = 'Aktivitas berhasil disimpan';
    alert.buttons = ['OK'];
    document.body.appendChild(alert);
    await alert.present();
    await alert.onDidDismiss();

    
    window.dispatchEvent(new CustomEvent('activity:changed', { detail: { action: 'add', id: saved && saved.id } }));

    
    router.push('/home');

  } catch (error) {
    console.error('❌ Error saving activity:', error);
    
    
    const alert = document.createElement('ion-alert');
    alert.header = 'Error!';
    alert.message = `Gagal menyimpan: ${error.message}`;
    alert.buttons = ['OK'];
    document.body.appendChild(alert);
    await alert.present();
  }
};


const resetForm = () => {
  activity.value = new Activity();
  activityDate.value = new Date().toISOString();
  activityTime.value = new Date().toISOString();
};


const getCategoryIcon = (categoryName) => {
  const category = categories.find(cat => cat.name === categoryName);
  return category ? category.icon : ellipsisHorizontal;
};


const getCategoryColorHex = (categoryName) => {
  const colors = {
    'Olahraga': '#10B981',
    'Membaca': '#3B82F6',
    'Belajar': '#8B5CF6',
    'Bekerja': '#F59E0B',
    'Hiburan': '#EC4899'
  };
  return colors[categoryName] || '#718096';
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

.back-btn {
  --color: #2D3748;
}

.container {
  padding: 0 24px 40px 24px;
}

.input-group {
  margin-bottom: 24px;
}

.section-label {
  display: block;
  font-weight: 700;
  color: #2D3748;
  margin-bottom: 10px;
  font-size: 0.95rem;
}

/* Pop Card Inputs */
.pop-input-card {
  background: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 4px 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.textarea-card {
  padding: 12px 16px;
}

.input-icon {
  font-size: 20px;
  margin-right: 12px;
  color: #A0AEC0;
}

.main-input, .main-select {
  --padding-start: 0;
  font-weight: 600;
  color: #2D3748;
}

/* Duration Indigo Pop Card */
.duration-pop-card {
  background: #E0E7FF;
  border-radius: 28px;
  padding: 24px;
  text-align: center;
}

.timer-display {
  font-size: 3.5rem;
  font-weight: 900;
  color: #312E81;
  font-family: 'monospace';
  letter-spacing: -2px;
  margin-bottom: 24px;
}

.duration-controls-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.unit-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
  color: #4338CA;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.btn-wrap {
  background: white;
  padding: 6px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.circle-step-btn {
  background: #F5F7FA;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4338CA;
  font-size: 18px;
}

.val {
  font-weight: 900;
  color: #312E81;
  font-size: 1.1rem;
}

.quick-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.pill-chip {
  background: rgba(255,255,255,0.5);
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #4338CA;
  transition: 0.2s;
}

.pill-chip:active {
  background: white;
  transform: scale(0.95);
}

/* DateTime Grid */
.datetime-pop-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dt-card {
  background: white;
  padding: 12px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.dt-card ion-icon {
  color: #4338CA;
  font-size: 18px;
}

/* Footer & Buttons */
.action-footer {
  margin-top: 40px;
}

.main-save-btn {
  --background: #000000;
  --color: white;
  --border-radius: 20px;
  --padding-top: 20px;
  --padding-bottom: 20px;
  font-weight: 800;
  font-size: 1.1rem;
  margin-bottom: 12px;
}

.reset-link-btn {
  --color: #718096;
  font-weight: 600;
  font-size: 0.9rem;
}
</style>