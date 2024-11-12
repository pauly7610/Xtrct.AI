//src/screens/Sharing.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share as RNShare,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Search, Users, X, Copy, Share as ShareIcon } from 'lucide-react-native';
import { navigationHandlers } from 'src/navigation/navigationHandlers';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';
import { firebaseService } from 'src/services/firebaseConfig.js';
import * as Clipboard from 'expo-clipboard';

const SharingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { handleClose, handleShareComplete } = navigationHandlers.sharingHandlers;

  const [searchText, setSearchText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [recentUsers, setRecentUsers] = useState([]);

  const sharedData = route.params?.data || {};
  const shareType = route.params?.type || 'activity';

  useEffect(() => {
    appMonitor.trackScreenView('Sharing', { shareType });
    generateShareLink();
    fetchRecentUsers();
  }, [shareType]);

  const generateShareLink = useCallback(async () => {
    try {
      const currentUser = firebaseService.getCurrentUser();
      if (!currentUser) {
        handleClose(navigation);
        return;
      }

      const shareData = {
        type: shareType,
        data: sharedData,
        sharedBy: currentUser.uid,
        createdAt: new Date().toISOString()
      };

      const shareId = await firebaseService.createShareLink(shareData);
      setShareLink(`https://yourapp.com/share/${shareId}`);
      
      appMonitor.trackEvent('share_link_generated', {
        shareType,
        shareId
      });
    } catch (error) {
      appMonitor.logError(error, {
        context: 'generate_share_link',
        shareType
      });
      Alert.alert('Error', 'Failed to generate share link');
    }
  }, [shareType, sharedData, navigation, handleClose]);

  const fetchRecentUsers = useCallback(async () => {
    try {
      const currentUser = firebaseService.getCurrentUser();
      if (!currentUser) return;

      const users = await firebaseService.getRecentlySharedUsers(currentUser.uid);
      setRecentUsers(users);
    } catch (error) {
      appMonitor.logError(error, { context: 'fetch_recent_users' });
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!shareLink) return;

    setIsProcessing(true);
    try {
      const result = await RNShare.share({
        message: Platform.OS === 'ios' ? undefined : shareLink,
        url: Platform.OS === 'ios' ? shareLink : undefined,
        title: 'Share via'
      });

      if (result.action === RNShare.sharedAction) {
        appMonitor.trackEvent('content_shared', {
          shareType,
          method: 'native_share'
        });
        handleShareComplete(navigation, { success: true });
      }
    } catch (error) {
      appMonitor.logError(error, { context: 'share_content' });
      Alert.alert('Error', 'Failed to share content');
    } finally {
      setIsProcessing(false);
    }
  }, [shareLink, shareType, navigation, handleShareComplete]);

  const copyToClipboard = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(shareLink);
      appMonitor.trackEvent('link_copied', { shareType });
      Alert.alert('Success', 'Link copied to clipboard');
    } catch (error) {
      appMonitor.logError(error, { context: 'copy_link' });
      Alert.alert('Error', 'Failed to copy link');
    }
  }, [shareLink, shareType]);

  const handleSearch = useCallback((text) => {
    setSearchText(text);
    appMonitor.trackEvent('share_search', { query: text });
  }, []);

  const handleUserSelect = useCallback((user) => {
    appMonitor.trackEvent('user_selected_for_share', { 
      userId: user.id,
      shareType 
    });
    // Implement user selection logic
  }, [shareType]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => handleClose(navigation)}
          disabled={isProcessing}
          accessibilityLabel="Close Sharing Screen"
        >
          <X size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share {shareType}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="rgba(255,255,255,0.6)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={searchText}
          onChangeText={handleSearch}
          editable={!isProcessing}
          returnKeyType="search"
          onSubmitEditing={() => appMonitor.trackEvent('search_performed', { query: searchText })}
          accessibilityLabel="Search for people to share with"
        />
      </View>

      <View style={styles.shareCard}>
        <View style={styles.iconContainer}>
          <Users size={32} color="#407BFF" />
        </View>
        
        <Text style={styles.cardTitle}>Quick Share</Text>
        
        {shareLink ? (
          <View style={styles.linkContainer}>
            <Text style={styles.linkText} numberOfLines={1}>
              {shareLink}
            </Text>
            <TouchableOpacity 
              style={styles.copyButton} 
              onPress={copyToClipboard}
              accessibilityLabel="Copy share link to clipboard"
            >
              <Copy size={20} color="#407BFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <ActivityIndicator color="#407BFF" />
        )}

        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
          disabled={isProcessing || !shareLink}
          accessibilityLabel="Share content"
        >
          {isProcessing ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <ShareIcon size={20} color="white" style={styles.shareIcon} />
              <Text style={styles.shareButtonText}>Share</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {recentUsers.length > 0 && (
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Recent</Text>
          {recentUsers.map(user => (
            <TouchableOpacity 
              key={user.id}
              style={styles.userItem}
              onPress={() => handleUserSelect(user)}
              accessibilityLabel={`Share with ${user.name}`}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.userInitial}>
                  {user.name.charAt(0)}
                </Text>
              </View>
              <Text style={styles.userName}>{user.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... (styles remain the same)
});

export default SharingScreen;