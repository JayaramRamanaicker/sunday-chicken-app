import { WeeklyRecord } from '../types';
import { calculateRecordMetrics } from '../utils/calculations';
import { getAuthToken } from './authService';

// ==========================================
// BACKEND CONFIGURATION
// ==========================================
// Set to false to connect to your real Node/Express/MongoDB backend
const USE_MOCK_BACKEND = false; 

// Use environment variable or fallback to localhost
const API_BASE_URL = 'http://localhost:5001/records';
const STORAGE_KEY = 'poultry_profit_data';

// Helper to simulate network delay for Mock mode
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to handle MongoDB _id to frontend id mapping
const mapToFrontend = (data: any): WeeklyRecord => {
  if (!data) return data;
  // If backend returns _id (MongoDB), map it to id
  const { _id, ...rest } = data;
  return {
    id: _id || data.id,
    ...rest
  };
};

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// ==========================================
// SERVICE METHODS
// ==========================================

export const getRecords = async (): Promise<WeeklyRecord[]> => {
  if (USE_MOCK_BACKEND) {
    await delay(300);
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized access");
        throw new Error(`Error fetching records: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    // Ensure we map _id to id for all records
    return Array.isArray(data) ? data.map(mapToFrontend) : [];
  } catch (error) {
    console.error("API Error (getRecords):", error);
    throw error;
  }
};

export const saveRecord = async (record: WeeklyRecord): Promise<WeeklyRecord> => {
  // Pre-calculate metrics on frontend (optional: backend can also do this)
  const processedRecord = calculateRecordMetrics(record);

  // MOCK IMPLEMENTATION
  if (USE_MOCK_BACKEND) {
    await delay(400);

    // Generate ID for new records
    if (!processedRecord.id) {
      processedRecord.id = Math.random().toString(36).substr(2, 9);
    }

    const currentRecords = await getRecords();
    const index = currentRecords.findIndex(r => r.id === processedRecord.id);
    
    let updatedRecords;
    if (index >= 0) {
      updatedRecords = [...currentRecords];
      updatedRecords[index] = processedRecord;
    } else {
      updatedRecords = [processedRecord, ...currentRecords];
    }

    updatedRecords.sort((a, b) => new Date(b.weekDate).getTime() - new Date(a.weekDate).getTime());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
    return processedRecord;
  }

  // REAL API IMPLEMENTATION
  try {
    // Determine if Create (POST) or Update (PUT)
    // If id is empty string or undefined, it's a new record
    const isNewRecord = !record.id || record.id.trim() === '';
    
    const url = isNewRecord 
      ? API_BASE_URL 
      : `${API_BASE_URL}/${record.id}`;

    const method = isNewRecord ? 'POST' : 'PUT';

    // Prepare payload: remove empty ID so MongoDB generates a new ObjectId
    const payload: any = { ...processedRecord };
    if (isNewRecord) {
      delete payload.id;
      delete payload._id;
    }

    const response = await fetch(url, {
      method: method,
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error saving record: ${response.status}`);
    }
    
    const savedData = await response.json();
    return mapToFrontend(savedData);
  } catch (error) {
    console.error("API Error (saveRecord):", error);
    throw error;
  }
};

export const deleteRecord = async (id: string): Promise<void> => {
  if (USE_MOCK_BACKEND) {
    await delay(300);
    const currentRecords = await getRecords();
    const filtered = currentRecords.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting record: ${response.status}`);
    }
  } catch (error) {
    console.error("API Error (deleteRecord):", error);
    throw error;
  }
};

export const getRecordById = async (id: string): Promise<WeeklyRecord | undefined> => {
  if (USE_MOCK_BACKEND) {
    const records = await getRecords();
    return records.find(r => r.id === id);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) return undefined;
    
    const data = await response.json();
    return mapToFrontend(data);
  } catch (error) {
    console.error("API Error (getRecordById):", error);
    return undefined;
  }
};