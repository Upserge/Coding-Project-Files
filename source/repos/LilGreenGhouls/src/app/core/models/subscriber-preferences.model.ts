export type NotificationFrequency = 'every-post' | 'weekly-digest' | 'monthly-digest';

export interface SubscriberPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  frequency: NotificationFrequency;
  categories: string[];
}

export const DEFAULT_SUBSCRIBER_PREFERENCES: SubscriberPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  frequency: 'every-post',
  categories: [],
};
