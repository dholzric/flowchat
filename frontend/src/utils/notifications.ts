let notificationsEnabled = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    notificationsEnabled = true;
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    notificationsEnabled = permission === 'granted';
    return notificationsEnabled;
  }

  return false;
}

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export function showNotification(options: NotificationOptions) {
  if (!notificationsEnabled || Notification.permission !== 'granted') {
    return;
  }

  const notification = new Notification(options.title, {
    body: options.body,
    icon: options.icon || '/vite.svg',
    tag: options.tag,
  });

  if (options.onClick) {
    notification.onclick = () => {
      window.focus();
      options.onClick?.();
      notification.close();
    };
  }

  // Auto-close after 5 seconds
  setTimeout(() => notification.close(), 5000);
}

export function isNotificationEnabled(): boolean {
  return notificationsEnabled && Notification.permission === 'granted';
}
