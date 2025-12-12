import type { Activity } from '@/models/Activity';

declare class StorageService {
  constructor();
  init(): Promise<void>;
  saveActivity(activity: Activity): Promise<void>;
  getActivities(): Promise<Activity[]>;
  updateActivity(activity: Activity): Promise<void>;
  deleteActivity(id: string): Promise<void>;
  getActivitiesByDate(date: Date): Promise<Activity[]>;
  getActivitiesByCategory(category: string): Promise<Activity[]>;
  getAllCategories(): Promise<string[]>;
  clearAllActivities(): Promise<void>;
  ensureInit(): Promise<void>;
}

declare const storageService: StorageService;
export default storageService;
