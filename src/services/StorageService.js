import { Storage } from '@ionic/storage';
import { Activity } from '@/models/Activity';

class StorageService {
  constructor() {
    this.storage = null;
    this.activitiesKey = 'activities';
  }

  async init() {
    this.storage = new Storage();
    await this.storage.create();
    console.log('✅ Storage initialized');
  }

  async saveActivity(activity) {
    try {
      await this.ensureInit();
      
      console.log('💾 Saving activity:', activity);
      
      // CONVERT TO PLAIN OBJECT - INI YANG PERBAIKAN
      let activityData;
      if (activity instanceof Activity) {
        activityData = activity.toJSON();
      } else if (activity && typeof activity === 'object') {
        // Jika sudah plain object, pakai langsung
        activityData = activity;
      } else {
        throw new Error('Invalid activity data');
      }
      
      console.log('📦 Converted to JSON:', activityData);
      
      // Get existing activities
      const activities = await this.getActivities();
      console.log('📊 Existing activities count:', activities.length);
      
      // Find existing index
      const existingIndex = activities.findIndex(a => a.id === activityData.id);
      
      if (existingIndex >= 0) {
        // Update existing
        activities[existingIndex] = Activity.fromJSON(activityData);
        console.log('🔄 Updating existing activity');
      } else {
        // Add new
        activities.push(Activity.fromJSON(activityData));
        console.log('➕ Adding new activity');
      }
      
      // Save as array of plain objects
      const activitiesToSave = activities.map(a => a.toJSON());
      console.log('💿 Saving to storage:', activitiesToSave);
      
      await this.storage.set(this.activitiesKey, activitiesToSave);
      
      console.log('✅ Activity saved successfully');
      return Activity.fromJSON(activityData);
      
    } catch (error) {
      console.error('❌ Error in saveActivity:', error);
      throw error;
    }
  }

  async getActivities() {
    try {
      await this.ensureInit();
      const data = await this.storage.get(this.activitiesKey) || [];
      console.log('📥 Raw data from storage:', data);
      
      // Convert plain objects back to Activity instances
      const activities = data.map(item => {
        try {
          return Activity.fromJSON(item);
        } catch (e) {
          console.error('Error converting item:', item, e);
          return null;
        }
      }).filter(item => item !== null);
      
      console.log('📋 Activities loaded:', activities.length);
      return activities;
    } catch (error) {
      console.error('❌ Error getting activities:', error);
      return [];
    }
  }

  async getActivitiesByDate(date) {
    const activities = await this.getActivities();
    const targetDate = new Date(date);
    
    return activities.filter(activity => {
      if (!activity || !activity.date) return false;
      const activityDate = new Date(activity.date);
      return activityDate.getFullYear() === targetDate.getFullYear() &&
             activityDate.getMonth() === targetDate.getMonth() &&
             activityDate.getDate() === targetDate.getDate();
    });
  }

  async deleteActivity(id) {
    try {
      await this.ensureInit();
      const activities = await this.getActivities();
      const filteredActivities = activities.filter(activity => activity.id !== id);
      
      // Save as plain objects
      await this.storage.set(this.activitiesKey, filteredActivities.map(a => a.toJSON()));
      return true;
    } catch (error) {
      console.error('❌ Error deleting activity:', error);
      return false;
    }
  }

  async clearAll() {
    try {
      await this.ensureInit();
      await this.storage.remove(this.activitiesKey);
      return true;
    } catch (error) {
      console.error('❌ Error clearing activities:', error);
      return false;
    }
  }

  async ensureInit() {
    if (!this.storage) {
      await this.init();
    }
  }

  async getStatistics(date = new Date()) {
    const activities = await this.getActivities();
    
    const dailyActivities = activities.filter(activity => {
      if (!activity || !activity.date) return false;
      const activityDate = new Date(activity.date);
      return activityDate.getFullYear() === date.getFullYear() &&
             activityDate.getMonth() === date.getMonth() &&
             activityDate.getDate() === date.getDate();
    });

    const categoryStats = {};
    dailyActivities.forEach(activity => {
      if (!categoryStats[activity.category]) {
        categoryStats[activity.category] = {
          count: 0,
          duration: 0,
          color: this.getCategoryColor(activity.category)
        };
      }
      categoryStats[activity.category].count++;
      categoryStats[activity.category].duration += activity.duration;
    });

    const totalDuration = dailyActivities.reduce((total, activity) => {
      return total + (activity.duration || 0);
    }, 0);

    return {
      totalActivities: dailyActivities.length,
      totalDuration,
      categoryStats,
      activities: dailyActivities
    };
  }

  getCategoryColor(category) {
    const colors = {
      'Olahraga': '#4CAF50',
      'Membaca': '#2196F3',
      'Belajar': '#9C27B0',
      'Bekerja': '#FF9800',
      'Hiburan': '#E91E63',
      'Lainnya': '#795548'
    };
    return colors[category] || '#607D8B';
  }

  // Debug method
  async debugStorage() {
    await this.ensureInit();
    const keys = await this.storage.keys();
    console.log('🗝️ Storage keys:', keys);
    
    const activities = await this.getActivities();
    console.log('📋 Activities in storage:', activities);
    
    return { keys, activities };
  }
}

export default new StorageService();