/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module './services/StorageService' {
  import type { Activity } from '@/models/Activity'
  class StorageService {
    init(): Promise<void>
    saveActivity(activity: Activity): Promise<void>
    getActivities(): Promise<Activity[]>
    updateActivity(activity: Activity): Promise<void>
    deleteActivity(id: string): Promise<void>
    getActivitiesByDate(date: Date): Promise<Activity[]>
    getActivitiesByCategory(category: string): Promise<Activity[]>
    getAllCategories(): Promise<string[]>
    clearAllActivities(): Promise<void>
    ensureInit(): Promise<void>
  }
  const storageService: StorageService
  export default storageService
}