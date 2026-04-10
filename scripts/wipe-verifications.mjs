import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  projectId: "studio-3343148485-16424",
  appId: "1:312209983488:web:d545aad7f2ac1ff410f0e5",
  apiKey: "AIzaSyCTxSNJZ24Qgu9R16mkViJzcICrVGYG5ko",
  authDomain: "studio-3343148485-16424.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sign in anonymously first (same as the app does)
console.log('Authenticating...');
await signInAnonymously(auth);
console.log('Authenticated. Fetching verification logs...');

const snap = await getDocs(collection(db, 'verifications'));
console.log(`Found ${snap.size} verification log(s).`);

if (snap.size === 0) {
  console.log('✅ Already clean — no logs to delete.');
  process.exit(0);
}

console.log('Deleting...');
let deleted = 0;
for (const d of snap.docs) {
  await deleteDoc(doc(db, 'verifications', d.id));
  deleted++;
  if (deleted % 10 === 0) console.log(`  ...deleted ${deleted}/${snap.size}`);
}

console.log(`✅ Wiped ${deleted} verification log(s). Fresh start!`);
process.exit(0);
