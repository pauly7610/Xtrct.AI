import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

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
      await db.collection('tasks').doc(taskId).update(updates);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }
};

export { app, db, auth };
