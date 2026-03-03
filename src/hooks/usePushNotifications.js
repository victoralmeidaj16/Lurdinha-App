import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const usePushNotifications = (userId) => {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    async function registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                alert('Failed to get push token for push notification!');
                return;
            }

            try {
                token = (await Notifications.getExpoPushTokenAsync({
                    projectId: Constants.expoConfig?.extra?.eas?.projectId,
                })).data;
            } catch (e) {
                console.log("Error getting token", e);
            }

        } else {
            alert('Must use physical device for Push Notifications');
        }

        return token;
    }

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log(response);
        });

        return () => {
            notificationListener.current && notificationListener.current.remove();
            responseListener.current && responseListener.current.remove();
        };
    }, []);

    // Save token to Firestore when userId and token are available
    useEffect(() => {
        const saveToken = async () => {
            if (userId && expoPushToken) {
                try {
                    const userRef = doc(db, 'users', userId);
                    await setDoc(userRef, { expoPushToken }, { merge: true });
                    console.log('Push token saved to Firestore for user:', userId);
                } catch (error) {
                    console.error('Error saving push token:', error);
                }
            }
        };

        saveToken();
    }, [userId, expoPushToken]);

    return {
        expoPushToken,
        notification,
    };
};

/**
 * Envia uma notificação push usando a API da Expo
 * @param {string|string[]} target - Token de push ou array de tokens
 * @param {string} title - Título da notificação
 * @param {string} body - Mensagem da notificação
 * @param {Object} data - Dados extras (opcional)
 */
export const sendPushNotification = async (target, title, body, data = {}) => {
    const tokens = Array.isArray(target) ? target : [target];
    const validTokens = tokens.filter(t => t && t.startsWith('ExponentPushToken'));

    if (validTokens.length === 0) return;

    const message = {
        to: validTokens,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    };

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};
