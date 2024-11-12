import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  updateProfile,
  updateEmail
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD0BVjAyRhWXXnPomD_yTyXhDEQw7nZJdc",
  authDomain: "task-a117a.firebaseapp.com",
  projectId: "task-a117a",
  storageBucket: "task-a117a.appspot.com",
  messagingSenderId: "45000234974",
  appId: "1:45000234974:web:3264c6958534eab902af4f",
  measurementId: "G-LHQKL5MTGD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const firebaseService = {
  // Authentication Methods
  async signIn() {
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  async updateUserEmail(email) {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateEmail(user, email);
        // Also update in Firestore if you're storing user data there
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { email });
      } else {
        throw new Error('No user is currently signed in');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  },

  async updateUserProfile(profileData) {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, profileData);
        // Also update in Firestore if you're storing user data there
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { 
          displayName: profileData.displayName,
          updatedAt: new Date().toISOString()
        });
      } else {
        throw new Error('No user is currently signed in');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Task Management Methods
  async getTasks(userId) {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  async addTask(userId, taskData) {
    try {
      const tasksRef = collection(db, 'tasks');
      const newTask = {
        ...taskData,
        userId,
        createdAt: new Date().toISOString(),
        completed: false
      };
      const docRef = await addDoc(tasksRef, newTask);
      return {
        id: docRef.id,
        ...newTask
      };
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  async updateTask(taskId, updates) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return taskId;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // User Management Methods
  async createOrUpdateUser(userData) {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          ...userData,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  },

  // Utility Methods
  getCurrentUser() {
    return auth.currentUser;
  },

  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }
};

export { app, db, auth };

export const firebaseAuthConfig = {
  google: {
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    tenantId: process.env.MICROSOFT_TENANT_ID,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI,
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID,
    redirectUri: process.env.APPLE_REDIRECT_URI,
  }
};
