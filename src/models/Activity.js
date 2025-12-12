import { v4 as uuidv4 } from 'uuid';

export class Activity {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.title = data.title || '';
    this.category = data.category || 'Olahraga';
    this.startTime = data.startTime ? new Date(data.startTime) : new Date();
    this.endTime = data.endTime ? new Date(data.endTime) : null;
    this.duration = data.duration || 0; // in seconds
    this.notes = data.notes || '';
    this.date = data.date ? new Date(data.date) : new Date();
  }

  get formattedDuration() {
    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);
    const seconds = this.duration % 60;
    
    return `${hours.toString().padStart(2, '0')}:${
      minutes.toString().padStart(2, '0')}:${
      seconds.toString().padStart(2, '0')}`;
  }

  get formattedTime() {
    return this.startTime.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  get formattedDate() {
    return this.date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  get dateShort() {
    return this.date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime ? this.endTime.toISOString() : null,
      duration: this.duration,
      notes: this.notes,
      date: this.date.toISOString()
    };
  }

  static fromJSON(json) {
    return new Activity({
      ...json,
      startTime: new Date(json.startTime),
      endTime: json.endTime ? new Date(json.endTime) : null,
      date: new Date(json.date)
    });
  }
}

export const CATEGORIES = [
  { id: 'olahraga', name: 'Olahraga', icon: 'fitness', color: '#4CAF50' },
  { id: 'membaca', name: 'Membaca', icon: 'book', color: '#2196F3' },
  { id: 'belajar', name: 'Belajar', icon: 'school', color: '#9C27B0' },
  { id: 'bekerja', name: 'Bekerja', icon: 'briefcase', color: '#FF9800' },
  { id: 'hiburan', name: 'Hiburan', icon: 'film', color: '#E91E63' },
  { id: 'lainnya', name: 'Lainnya', icon: 'ellipsis-horizontal', color: '#795548' }
];