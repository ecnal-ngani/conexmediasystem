import { User } from "@/components/auth-context";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Firestore } from "firebase/firestore";

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: 'attendance' | 'performance' | 'social';
}

export const ALL_BADGES: Badge[] = [
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Clocked in before 8:00 AM',
    imageUrl: '/badges/early_bird.png', // We'll need to host this or use the local path if possible
    category: 'attendance'
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Clocked out after 8:00 PM',
    imageUrl: '/badges/night_owl.png',
    category: 'attendance'
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: '5 consecutive days of attendance',
    imageUrl: '/badges/streak.png',
    category: 'attendance'
  }
];

/**
 * Checks and awards badges based on current session data
 */
export async function checkAndAwardBadges(user: User, firestore: Firestore, type: 'clock-in' | 'clock-out') {
  if (!user || !firestore) return null;

  const now = new Date();
  const currentBadges = user.badges || [];
  const newBadges: string[] = [...currentBadges];
  let awarded = false;

  if (type === 'clock-in') {
    // Early Bird Logic: Before 8:00 AM
    if (now.getHours() < 8 && !currentBadges.includes('early_bird')) {
      newBadges.push('early_bird');
      awarded = true;
    }
  }

  if (type === 'clock-out') {
    // Night Owl Logic: After 8:00 PM (20:00)
    if (now.getHours() >= 20 && !currentBadges.includes('night_owl')) {
      newBadges.push('night_owl');
      awarded = true;
    }
  }

  if (awarded) {
    const userRef = doc(firestore, 'users', user.id);
    await setDoc(userRef, { 
      badges: newBadges,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return newBadges;
  }

  return null;
}
