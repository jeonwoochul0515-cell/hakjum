import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

export interface ProfileExtra {
  userType?: string;
  grade?: string;
  schoolName?: string;
}

export interface SavedResult {
  id: string;
  career: string;
  major: string;
  date: string;
  subjectCount: number;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  profileExtra: ProfileExtra;
  savedResults: SavedResult[];
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileExtra: (data: ProfileExtra) => Promise<void>;
  addSavedResult: (result: Omit<SavedResult, 'id'>) => Promise<void>;
  deleteSavedResult: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

async function migrateLocalStorage(uid: string) {
  const profileRaw = localStorage.getItem('hakjum-profile');
  if (profileRaw) {
    try {
      const data = JSON.parse(profileRaw) as ProfileExtra;
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, data);
      }
      localStorage.removeItem('hakjum-profile');
    } catch { /* ignore */ }
  }

  const resultsRaw = localStorage.getItem('hakjum-saved-results');
  if (resultsRaw) {
    try {
      const results = JSON.parse(resultsRaw) as SavedResult[];
      const colRef = collection(db, 'users', uid, 'savedResults');
      const existing = await getDocs(colRef);
      if (existing.empty && results.length > 0) {
        for (const r of results) {
          const { id: _id, ...rest } = r;
          await addDoc(colRef, rest);
        }
      }
      localStorage.removeItem('hakjum-saved-results');
    } catch { /* ignore */ }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileExtra, setProfileExtra] = useState<ProfileExtra>({});
  const [savedResults, setSavedResults] = useState<SavedResult[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await migrateLocalStorage(user.uid);
        await loadUserData(user.uid);
      } else {
        setProfileExtra({});
        setSavedResults([]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function loadUserData(uid: string) {
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        setProfileExtra(userSnap.data() as ProfileExtra);
      }
    } catch { /* ignore */ }

    try {
      const colRef = collection(db, 'users', uid, 'savedResults');
      const snap = await getDocs(colRef);
      const results: SavedResult[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as SavedResult[];
      setSavedResults(results);
    } catch { /* ignore */ }
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email: string, password: string, displayName: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
  }

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
  }

  async function updateProfileExtra(data: ProfileExtra) {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      await updateDoc(userRef, data);
    } else {
      await setDoc(userRef, data);
    }
    setProfileExtra(data);
  }

  async function addSavedResult(result: Omit<SavedResult, 'id'>) {
    if (!currentUser) return;
    const colRef = collection(db, 'users', currentUser.uid, 'savedResults');
    const docRef = await addDoc(colRef, result);
    setSavedResults((prev) => [...prev, { id: docRef.id, ...result }]);
  }

  async function deleteSavedResult(id: string) {
    if (!currentUser) return;
    await deleteDoc(doc(db, 'users', currentUser.uid, 'savedResults', id));
    setSavedResults((prev) => prev.filter((r) => r.id !== id));
  }

  const value: AuthContextType = {
    currentUser,
    loading,
    profileExtra,
    savedResults,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateProfileExtra,
    addSavedResult,
    deleteSavedResult,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
