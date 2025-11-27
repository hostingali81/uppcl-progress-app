import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export class NotificationService {
    private static initialized = false;

    /**
     * Initialize notification service
     * Call this once when app starts
     */
    static async initialize() {
        if (this.initialized) return;

        try {
            // Request permissions
            await this.requestPermissions();

            // Register listeners
            this.registerListeners();

            // Create notification channels
            await this.createChannels();

            this.initialized = true;
            console.log('✅ Notification service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize notifications:', error);
        }
    }

    /**
     * Request notification permissions
     */
    private static async requestPermissions() {
        try {
            if (Capacitor.isNativePlatform()) {
                // Request push notification permissions
                const result = await PushNotifications.requestPermissions();

                if (result.receive === 'granted') {
                    console.log('✅ Push notification permission granted');
                    // Register with FCM
                    await PushNotifications.register();
                } else {
                    console.log('ℹ️ Push notification permission denied');
                }
            } else {
                console.log('ℹ️ Push notifications not supported on web');
            }

            // Request local notification permissions (fallback/additional)
            try {
                const localResult = await LocalNotifications.requestPermissions();

                if (localResult.display === 'granted') {
                    console.log('✅ Local notifications enabled');
                } else {
                    console.log('ℹ️ Local notification permission not granted');
                }
            } catch (localError) {
                console.error('⚠️ Local notification setup failed:', localError);
            }
        } catch (error) {
            console.error('❌ Error requesting permissions:', error);
            // Don't throw - let the app continue
        }
    }

    /**
     * Register notification event listeners
     */
    private static registerListeners() {
        // Local notification tapped
        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
            console.log('👆 Local notification tapped:', action);

            // Navigate to specific page
            const url = action.notification.extra?.url || '/notifications';
            window.location.href = url;
        });

        if (Capacitor.isNativePlatform()) {
            // Push notification registration success
            PushNotifications.addListener('registration', async (token) => {
                console.log('✅ Push registration success, token:', token.value);

                // Save token to database
                try {
                    await this.savePushToken(token.value);
                } catch (error) {
                    console.error('Failed to save push token:', error);
                }
            });

            // Push notification registration error
            PushNotifications.addListener('registrationError', (error) => {
                console.error('❌ Push registration failed:', error);
            });

            // Push notification received
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('📩 Push notification received:', notification);

                // Show as local notification to ensure consistent UI/sound
                // (Push notifications automatically show system UI when app is in background,
                // but we might want to handle foreground specially)
                this.sendLocalNotification(
                    notification.title || 'New Notification',
                    notification.body || '',
                    {
                        sound: 'default',
                        vibrate: true,
                        actionUrl: notification.data?.url
                    }
                );
            });

            // Push notification tapped
            PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                console.log('👆 Push notification tapped:', action);
                const url = action.notification.data?.url || '/notifications';
                window.location.href = url;
            });
        }
    }

    /**
     * Create notification channels for Android
     * Note: This only works on native platforms (Android/iOS), not on web
     */
    private static async createChannels() {
        // Skip channel creation on web - it's not supported
        if (!Capacitor.isNativePlatform()) {
            console.log('ℹ️ Skipping notification channel creation on web platform');
            return;
        }

        try {
            // High Priority Channel - Urgent updates
            try {
                await LocalNotifications.createChannel({
                    id: 'high-priority',
                    name: 'Urgent Updates',
                    description: 'Important notifications with sound and vibration',
                    importance: 5, // Max importance
                    sound: 'default', // Using default Android sound
                    vibration: true,
                    visibility: 1 // Public
                });
            } catch (e) {
                console.warn('High priority channel creation failed:', e);
            }

            // Normal Priority Channel - Regular updates
            try {
                await LocalNotifications.createChannel({
                    id: 'normal',
                    name: 'Regular Updates',
                    description: 'Standard notifications',
                    importance: 3, // Default importance
                    sound: 'default',
                    vibration: false,
                    visibility: 1
                });
            } catch (e) {
                console.warn('Normal channel creation failed:', e);
            }

            // Silent Channel - Background sync
            try {
                await LocalNotifications.createChannel({
                    id: 'silent',
                    name: 'Background Sync',
                    description: 'Silent background updates',
                    importance: 2, // Low importance
                    vibration: false,
                    visibility: 0 // Private
                });
            } catch (e) {
                console.warn('Silent channel creation failed:', e);
            }

            console.log('✅ Notification channels created');
        } catch (error) {
            console.error('❌ Failed to create channels:', error);
            // Don't throw - allow app to continue
        }
    }

    /**
     * Send a local notification
     */
    static async sendLocalNotification(
        title: string,
        body: string,
        options?: {
            sound?: string;
            vibrate?: boolean;
            channelId?: 'high-priority' | 'normal' | 'silent';
            actionUrl?: string;
            id?: number;
        }
    ) {
        try {
            await LocalNotifications.schedule({
                notifications: [{
                    title,
                    body,
                    id: options?.id || Date.now(),
                    sound: options?.sound || 'default', // Using default Android sound
                    channelId: options?.channelId || 'high-priority',
                    extra: {
                        url: options?.actionUrl || '/notifications'
                    },
                    smallIcon: 'ic_stat_icon_config_sample',
                    iconColor: '#3b82f6'
                }]
            });

            // Haptic feedback
            if (options?.vibrate !== false) {
                await Haptics.impact({ style: ImpactStyle.Medium });
            }

            console.log('✅ Local notification sent');
        } catch (error) {
            console.error('❌ Failed to send notification:', error);
        }
    }

    /**
     * Send notification for new comment
     */
    static async notifyNewComment(workId: string, commenterName: string, comment: string) {
        await this.sendLocalNotification(
            `New Comment from ${commenterName}`,
            comment.substring(0, 100) + (comment.length > 100 ? '...' : ''),
            {
                sound: 'default',
                vibrate: true,
                channelId: 'high-priority',
                actionUrl: `/dashboard/work/${workId}`
            }
        );
    }

    /**
     * Send notification for work status update
     */
    static async notifyWorkUpdate(workId: string, workName: string, status: string) {
        await this.sendLocalNotification(
            'Work Status Updated',
            `${workName} is now ${status}`,
            {
                sound: 'default',
                vibrate: true,
                channelId: 'normal',
                actionUrl: `/dashboard/work/${workId}`
            }
        );
    }

    /**
     * Send notification for sync completion
     */
    static async notifySyncComplete(itemCount: number) {
        await this.sendLocalNotification(
            'Sync Complete',
            `${itemCount} item(s) synced successfully`,
            {
                sound: 'default',
                vibrate: false,
                channelId: 'silent',
                actionUrl: '/dashboard'
            }
        );
    }

    /**
     * Get pending notifications
     */
    static async getPendingNotifications() {
        const result = await LocalNotifications.getPending();
        return result.notifications;
    }

    /**
     * Cancel a notification
     */
    static async cancelNotification(id: number) {
        await LocalNotifications.cancel({ notifications: [{ id }] });
    }

    /**
     * Cancel all notifications
     */
    static async cancelAllNotifications() {
        await LocalNotifications.cancel({ notifications: [] });
    }

    /**
     * Check if notifications are enabled
     */
    static async areNotificationsEnabled(): Promise<boolean> {
        const result = await LocalNotifications.checkPermissions();
        return result.display === 'granted';
    }

    /**
     * Save push notification token to database
     */
    private static async savePushToken(token: string) {
        try {
            const response = await fetch('/api/push-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save token: ${response.statusText}`);
            }

            console.log('✅ Push token saved to database');
        } catch (error) {
            console.error('❌ Error saving push token:', error);
            throw error;
        }
    }
}
