import React, { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import RitualSubmissionScreen from './screens/RitualSubmissionScreen';
import RitualValidationScreen from './screens/RitualValidationScreen';
import CommunityScreen from './screens/CommunityScreen';
import HomeScreen from './screens/HomeScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const Stack = createStackNavigator();

const App: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => console.log(token));

    // Handle incoming notifications
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      Alert.alert('New Update', notification.request.content.body || 'You have a new update!');
    });

    // Check offline status
    checkOfflineStatus();

    return () => subscription.remove();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  };

  const checkOfflineStatus = async () => {
    try {
      // Simple check for offline data storage
      await AsyncStorage.setItem('test', 'offline-test');
      setIsOffline(false);
    } catch (error) {
      setIsOffline(true);
      Alert.alert('Offline Mode', 'App is running in offline mode. Some features may be limited.');
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Ritual Submission" component={RitualSubmissionScreen} />
        <Stack.Screen name="Ritual Validation" component={RitualValidationScreen} />
        <Stack.Screen name="Community" component={CommunityScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
