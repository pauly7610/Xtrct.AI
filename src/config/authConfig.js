// app/config/authConfig.js
export default {
    clientId: 'UJX24QLVr2Pe3q7ph8j6ik9uDHAChkYG',  // You'll get this from Auth0
    domain: 'dev-1dt52jbvr1asgtvz.us.auth0.com', // You'll get this from Auth0
    redirectUrl: 'com.taskprioritizer:/callback',
    scopes: ['openid', 'profile', 'email'],
  }