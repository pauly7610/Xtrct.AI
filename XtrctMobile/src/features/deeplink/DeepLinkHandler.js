import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function DeepLinkHandler() {
  const navigation = useNavigation();

  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      if (url) {
        // Parse URL
        const route = url.replace(/.*?:\/\//g, '');
        const [path, params] = route.split('?');
        const id = params?.split('=')[1];

        // Navigate based on path
        switch (path) {
          case 'task':
            navigation.navigate('Task', { id });
            break;
          case 'share':
            navigation.navigate('Share');
            break;
          // Add other routes as needed
        }
      }
    };

    // Add event listener
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  return null;
} 
