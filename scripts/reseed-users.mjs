import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

// Use service account from environment or local file
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account.json';
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const initialStaff = [
  {
    systemId: 'CX-AD-01',
    name: 'System Administrator',
    email: 'admin@conex.media',
    securityToken: 'CONEX-ADMIN-INIT',
    role: 'ADMIN',
    status: 'Office',
    avatarUrl: 'https://picsum.photos/seed/admin/200/200'
  },
  {
    systemId: 'CX-ED-01',
    name: 'Lead Editor',
    email: 'editor@conex.media',
    securityToken: 'CONEX-EDITOR-TOKEN',
    role: 'EDITOR',
    status: 'WFH',
    avatarUrl: 'https://picsum.photos/seed/editor/200/200'
  },
  {
    systemId: 'CX-IN-01',
    name: 'Junior Intern',
    email: 'intern@conex.media',
    securityToken: 'CONEX-INTERN-TOKEN',
    role: 'INTERN',
    status: 'Office',
    avatarUrl: 'https://picsum.photos/seed/intern/200/200'
  }
];

async function seed() {
  console.log('--- RESEEDING USERS ---');
  const usersRef = db.collection('users');
  
  for (const staff of initialStaff) {
    const q = await usersRef.where('email', '==', staff.email).get();
    if (q.empty) {
      await usersRef.add({
        ...staff,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Added: ${staff.name}`);
    } else {
      console.log(`Exists: ${staff.name}`);
    }
  }
  console.log('--- SEED COMPLETE ---');
}

seed().catch(console.error);
