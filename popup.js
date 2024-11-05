import { firebaseService } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loginContainer = document.getElementById('loginContainer');
  const tasksContainer = document.getElementById('tasksContainer');
  const tasksList = document.getElementById('tasksList');
  const addTaskForm = document.getElementById('addTaskForm');
  let currentUser = null;

  // Check authentication state
  const checkAuth = async () => {
    const user = await chrome.storage.local.get('user');
    if (user.user) {
      currentUser = user.user;
     
