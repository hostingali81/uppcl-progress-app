import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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
            // NOTE: Push notifications disabled to avoid Firebase error
            // To enable: Set up Firebase and add google-services.json to android/app
            console.log('ℹ️ Push notifications disabled - using local notifications only');

            // Request local notification permissions
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
    }

    /**
     * Create notification channels for Android
     */
    private static async createChannels() {
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
}
