import { Trip, AppSettings } from '../types';

const DB_NAME = 'OpenTripDB';
const DB_VERSION = 2;
const TRIPS_STORE = 'trips';
const SETTINGS_STORE = 'settings';
const PROFILES_STORE = 'profiles';

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TRIPS_STORE)) {
        db.createObjectStore(TRIPS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }
      if (!db.objectStoreNames.contains(PROFILES_STORE)) {
        db.createObjectStore(PROFILES_STORE, { keyPath: 'name' });
      }
    };
  });
}

export async function saveTrip(trip: Trip): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRIPS_STORE, 'readwrite');
    const store = transaction.objectStore(TRIPS_STORE);
    const request = store.put(trip);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getTrips(): Promise<Trip[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRIPS_STORE, 'readonly');
    const store = transaction.objectStore(TRIPS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort trips by date descending
      const trips = request.result as Trip[];
      trips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(trips);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteTrip(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRIPS_STORE, 'readwrite');
    const store = transaction.objectStore(TRIPS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

const DEFAULT_SETTINGS: AppSettings = {
  units: 'metric',
  mapProvider: 'osm',
  theme: 'auto',
  googleMapsApiKey: '',
  soundAlerts: true,
  cameraRadius: 500,
  gForceCalibratedOffset: { x: 0, y: 0 },
  userProfile: null
};

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.put(settings, 'app_settings');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get('app_settings');

      request.onsuccess = () => {
        resolve(request.result ? { ...DEFAULT_SETTINGS, ...request.result } : DEFAULT_SETTINGS);
      };
      request.onerror = () => {
        resolve(DEFAULT_SETTINGS);
      };
    });
  } catch (error) {
    console.error('Error loading settings from DB, returning defaults:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveProfile(profile: any): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROFILES_STORE, 'readwrite');
    const store = transaction.objectStore(PROFILES_STORE);
    const request = store.put(profile);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getProfiles(): Promise<any[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROFILES_STORE, 'readonly');
    const store = transaction.objectStore(PROFILES_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProfile(name: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROFILES_STORE, 'readwrite');
    const store = transaction.objectStore(PROFILES_STORE);
    const request = store.delete(name);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
