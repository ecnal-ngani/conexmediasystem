import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "studio-3343148485-16424",
  "appId": "1:312209983488:web:d545aad7f2ac1ff410f0e5",
  "apiKey": "AIzaSyCTxSNJZ24Qgu9R16mkViJzcICrVGYG5ko",
  "authDomain": "studio-3343148485-16424.firebaseapp.com",
  "messagingSenderId": "312209983488"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const collectionsToWipe = [
  'verifications',
  'payroll_transactions',
  'tasks',
  'users',
  'projects',
  'brands',
  'schedules'
];

async function wipe() {
  console.log('--- DB WIPE INITIALIZED ---');
  
  try {
    await signInAnonymously(auth);
    console.log('Authenticated anonymously...');

    for (const collName of collectionsToWipe) {
      console.log(`Wiping collection: ${collName}...`);
      const collRef = collection(db, collName);
      const snapshot = await getDocs(collRef);
      
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, collName, d.id)));
      await Promise.all(deletePromises);
      console.log(`Successfully cleared ${snapshot.size} documents from ${collName}.`);
    }
    
    console.log('--- WIPE COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('Wipe failed:', err);
    process.exit(1);
  }
}

wipe();
