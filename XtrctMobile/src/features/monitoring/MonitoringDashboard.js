// src/components/MonitoringDashboard.js

import React, { useEffect, useState } from 'react';

import { 

  View, 

  Text, 

  ScrollView, 

  StyleSheet, 

  ActivityIndicator,

  Dimensions,

  TouchableOpacity

} from 'react-native';

import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

import { firebaseService } from 'src/config/firebaseConfig';

import { appMonitor } from 'src/services/monitoring/AppMonitoringService';

import { 

  Activity, 

  AlertTriangle, 

  CheckCircle2, 

  Clock, 

  Users, 

  Calendar,

  BarChart,

  TrendingUp

} from 'lucide-react-native';



const { width } = Dimensions.get('window');



export const MonitoringDashboard = () => {

  const [metrics, setMetrics] = useState(null);

  const [recentErrors, setRecentErrors] = useState([]);

  const [healthStatus, setHealthStatus] = useState(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    const loadDashboardData = async () => {

      try {

        setLoading(true);

        // Get current metrics

        const currentMetrics = appMonitor.getMetrics();

        setMetrics(currentMetrics);



        // Get recent errors

        const errorsQuery = query(

          collection(firebaseService.db, 'errors'),

          orderBy('timestamp', 'desc'),

          limit(10)

        );

        const errorSnap = await getDocs(errorsQuery);

        setRecentErrors(errorSnap.docs.map(doc => ({

          id: doc.id,

          ...doc.data()

        })));



        // Get system health

        const health = await appMonitor.performHealthCheck();

        setHealthStatus(health);

      } catch (error) {

        console.error('Error loading dashboard data:', error);

      } finally {

        setLoading(false);

      }

    };



    loadDashboardData();

    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s



    return () => clearInterval(interval);

  }, []);



  const MetricCard = ({ title, value, icon: Icon, color = '#007AFF' }) => (

    <View style={styles.card}>

      <View style={styles.cardHeader}>

        <Text style={styles.cardTitle}>{title}</Text>

        <Icon size={20} color={color} />

      </View>

      <Text style={styles.cardValue}>{value}</Text>

    </View>

  );



  if (loading) {

    return (

      <View style={styles.loadingContainer}>

        <ActivityIndicator size="large" color="#007AFF" />

      </View>

    );

  }



  return (

    <ScrollView style={styles.container}>

      <View style={styles.header}>

        <Text style={styles.title}>System Monitoring</Text>

        <Clock size={24} color="#666" />

      </View>



      <View style={styles.metricsGrid}>

        <MetricCard

          title="Active Users"

          value={metrics?.activeUsers || 0}

          icon={Users}

        />

        <MetricCard

          title="API Requests"

          value={metrics?.metrics?.api_requests || 0}

          icon={Activity}

        />

        <MetricCard

          title="Calendar Syncs"

          value={metrics?.metrics?.calendar_sync_total || 0}

          icon={Calendar}

        />

        <MetricCard

          title="Error Rate"

          value={`${((metrics?.metrics?.errors || 0) / (metrics?.metrics?.api_requests || 1) * 100).toFixed(2)}%`}

          icon={TrendingUp}

          color="#FF4444"

        />

      </View>



      <View style={styles.section}>

        <Text style={styles.sectionTitle}>System Health</Text>

        {Object.entries(healthStatus?.checks || {}).map(([key, value]) => (

          <View key={key} style={styles.healthItem}>

            {value.status === 'healthy' ? (

              <CheckCircle2 size={20} color="#4CAF50" />

            ) : (

              <AlertTriangle size={20} color="#FFC107" />

            )}

            <Text style={styles.healthText}>{key}</Text>

            <Text style={[

              styles.statusText,

              { color: value.status === 'healthy' ? '#4CAF50' : '#FFC107' }

            ]}>

              {value.status}

            </Text>

          </View>

        ))}

      </View>



      <View style={styles.section}>

        <Text style={styles.sectionTitle}>Recent Errors</Text>

        {recentErrors.map(error => (

          <View key={error.id} style={styles.errorCard}>

            <AlertTriangle size={20} color="#FF4444" />

            <View style={styles.errorContent}>

              <Text style={styles.errorMessage}>{error.message}</Text>

              <Text style={styles.errorTime}>

                {new Date(error.timestamp?.toDate()).toLocaleString()}

              </Text>

            </View>

          </View>

        ))}

      </View>

    </ScrollView>

  );

};



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: '#f5f5f5',

  },

  loadingContainer: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

  },

  header: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    padding: 16,

  },

  title: {

    fontSize: 24,

    fontWeight: 'bold',

    color: '#333',

  },

  metricsGrid: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    padding: 8,

  },

  card: {

    width: (width - 48) / 2,

    backgroundColor: 'white',

    borderRadius: 12,

    padding: 16,

    margin: 8,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.1,

    shadowRadius: 4,

    elevation: 3,

  },

  cardHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 8,

  },

  cardTitle: {

    fontSize: 14,

    color: '#666',

    fontWeight: '500',

  },

  cardValue: {

    fontSize: 24,

    fontWeight: 'bold',

    color: '#333',

  },

  section: {

    backgroundColor: 'white',

    borderRadius: 12,

    margin: 16,

    padding: 16,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.1,

    shadowRadius: 4,

    elevation: 3,

  },

  sectionTitle: {

    fontSize: 18,

    fontWeight: 'bold',

    color: '#333',

    marginBottom: 16,

  },

  healthItem: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingVertical: 8,

    borderBottomWidth: 1,

    borderBottomColor: '#f0f0f0',

  },

  healthText: {

    flex: 1,

    marginLeft: 12,

    fontSize: 16,

    color: '#333',

  },

  statusText: {

    fontSize: 14,

    fontWeight: '500',

  },

  errorCard: {

    flexDirection: 'row',

    padding: 12,

    backgroundColor: '#FFF5F5',

    borderRadius: 8,

    marginBottom: 8,

  },

  errorContent: {

    flex: 1,

    marginLeft: 12,

  },

  errorMessage: {

    fontSize: 14,

    color: '#333',

    marginBottom: 4,

  },

  errorTime: {

    fontSize: 12,

    color: '#666',

  },

});



export default MonitoringDashboard;
