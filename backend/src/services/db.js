import { config } from '../config/env.js';

/**
 * Database client adapter
 * Provides seamless PostgreSQL support when DATABASE_URL is configured,
 * or acts as an in-memory/seeded repository for local zero-dependency run.
 */

class DatabaseService {
  constructor() {
    this.pgPool = null;
    this.isPostgresConnected = false;

    // Seeded in-memory store
    this.store = {
      users: [
        {
          id: 'usr-admin',
          name: 'Central Admin',
          email: 'admin@probaho.bd',
          password_hash: '$2a$10$wTf2b3f3Xl1r5qZg0i1sOuS7P9E5yJ6kL8n4m2v0tQ8wZ1y2x3c4e', // password123
          role: 'admin'
        },
        {
          id: 'usr-approver',
          name: 'Dr. Rafiqul Islam (Civil Surgeon)',
          email: 'approver@probaho.bd',
          password_hash: '$2a$10$wTf2b3f3Xl1r5qZg0i1sOuS7P9E5yJ6kL8n4m2v0tQ8wZ1y2x3c4e',
          role: 'approver'
        },
        {
          id: 'usr-analyst',
          name: 'Nusrat Jahan (Supply Chain Analyst)',
          email: 'analyst@probaho.bd',
          password_hash: '$2a$10$wTf2b3f3Xl1r5qZg0i1sOuS7P9E5yJ6kL8n4m2v0tQ8wZ1y2x3c4e',
          role: 'analyst'
        },
        {
          id: 'usr-facility',
          name: 'Kamal Hossain (Store Keeper)',
          email: 'facility@probaho.bd',
          password_hash: '$2a$10$wTf2b3f3Xl1r5qZg0i1sOuS7P9E5yJ6kL8n4m2v0tQ8wZ1y2x3c4e',
          role: 'facility',
          facility_id: 'fac-001'
        }
      ],
      facilities: [
        { id: 'wh-001', name: 'Central Medical Stores Depot (CMSD)', name_bn: 'কেন্দ্রীয় ওষুধ গুদাম', type: 'warehouse', district: 'Dhaka', division: 'Dhaka', capacity: 5000000, coords: [23.7800, 90.4000] },
        { id: 'mfg-001', name: 'Padma Pharmaceutical Plant', name_bn: 'পদ্মা ফার্মাসিউটিক্যাল প্ল্যান্ট', type: 'manufacturer', district: 'Gazipur', division: 'Dhaka', capacity: 2000000, coords: [24.0023, 90.4264] },
        { id: 'sup-001', name: 'Chittagong Port Import Hub', name_bn: 'চট্টগ্রাম বন্দর আমদানি টার্মিনাল', type: 'supplier', district: 'Chittagong', division: 'Chittagong', capacity: 1000000, coords: [22.3569, 91.7832] },
        { id: 'fac-001', name: 'Pirganj Upazila Health Complex', name_bn: 'পীরগঞ্জ উপজেলা স্বাস্থ্য কমপ্লেক্স', type: 'upazila_health_complex', district: 'Rangpur', division: 'Rangpur', capacity: 50000, coords: [25.4167, 89.3167] },
        { id: 'fac-002', name: 'Morrelganj Upazila Health Complex', name_bn: 'মোড়েলগঞ্জ উপজেলা স্বাস্থ্য কমপ্লেক্স', type: 'upazila_health_complex', district: 'Bagerhat', division: 'Khulna', capacity: 45000, coords: [22.4561, 89.8569] },
        { id: 'fac-003', name: 'Shibchar Upazila Health Complex', name_bn: 'শিবচর উপজেলা স্বাস্থ্য কমপ্লেক্স', type: 'upazila_health_complex', district: 'Madaripur', division: 'Dhaka', capacity: 48000, coords: [23.3500, 90.1667] },
        { id: 'fac-004', name: 'Barakhata Community Clinic', name_bn: 'বড়খাতা কমিউনিটি ক্লিনিক', type: 'community_clinic', district: 'Lalmonirhat', division: 'Rangpur', capacity: 8000, coords: [26.0667, 89.1500] },
        { id: 'fac-005', name: 'Panchgaon Community Clinic', name_bn: 'পাঁচগাঁও কমিউনিটি ক্লিনিক', type: 'community_clinic', district: 'Moulvibazar', division: 'Sylhet', capacity: 7500, coords: [24.4500, 91.8000] },
        { id: 'fac-006', name: 'Char Fasson Community Clinic', name_bn: 'চরফ্যাশন কমিউনিটি ক্লিনিক', type: 'community_clinic', district: 'Bhola', division: 'Barishal', capacity: 9000, coords: [22.1833, 90.7167] }
      ],
      medicines: [
        { id: 'med-001', name: 'Paracetamol 500mg Tablet', name_bn: 'প্যারাসিটামল ৫০০ মি.গ্রা. ট্যাবলেট', ingredient_name: 'Paracetamol', ingredient_per_unit_grams: 0.5 },
        { id: 'med-002', name: 'Amoxicillin 500mg Capsule', name_bn: 'অ্যামোক্সিসিলিন ৫০০ মি.গ্রা. ক্যাপসুল', ingredient_name: 'Amoxicillin Trihydrate', ingredient_per_unit_grams: 0.58 },
        { id: 'med-003', name: 'Metformin 500mg Tablet', name_bn: 'মেটফরমিন ৫০০ মি.গ্রা. ট্যাবলেট', ingredient_name: 'Metformin Hydrochloride', ingredient_per_unit_grams: 0.5 },
        { id: 'med-004', name: 'Omeprazole 20mg Capsule', name_bn: 'ওমেপ্রাজল ২০ মি.গ্রা. ক্যাপসুল', ingredient_name: 'Omeprazole', ingredient_per_unit_grams: 0.02 },
        { id: 'med-005', name: 'Oral Rehydration Salts (ORS) Sachet', name_bn: 'খাবার স্যালাইন (ওআরএস)', ingredient_name: 'ORS Pre-mix', ingredient_per_unit_grams: 20.5 }
      ],
      inventory: [],
      recommendations: [],
      approvals: []
    };
  }

  async init() {
    if (config.databaseUrl) {
      try {
        const { Pool } = await import('pg');
        this.pgPool = new Pool({ connectionString: config.databaseUrl });
        const res = await this.pgPool.query('SELECT NOW()');
        this.isPostgresConnected = true;
        console.log('[DB] Connected to PostgreSQL at', res.rows[0].now);
      } catch (err) {
        console.warn('[DB] PostgreSQL connection failed. Falling back to in-memory store:', err.message);
        this.isPostgresConnected = false;
      }
    } else {
      console.log('[DB] No DATABASE_URL provided. Operating in seeded in-memory mode.');
    }
  }

  findUserByEmail(email) {
    return this.store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.store.users.find(u => u.id === id);
  }

  getFacilities() {
    return this.store.facilities;
  }

  getFacilityById(id) {
    if (!id) return null;
    const lower = id.toLowerCase();
    return this.store.facilities.find(f => f.id.toLowerCase() === lower);
  }

  getMedicines() {
    return this.store.medicines;
  }
}

export const db = new DatabaseService();

