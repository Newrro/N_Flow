'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function CapacitorIntegration() {
  const supabase = createClient();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cap = (window as any).Capacitor;
    if (!cap || !cap.isNativePlatform()) return;

    // Add capacitor-app class to body for CSS targeting
    document.body.classList.add('capacitor-app');

    const { PushNotifications } = cap.Plugins;
    if (!PushNotifications) return;

    let lastToken: string | null = localStorage.getItem('capacitor_device_token');

    const saveTokenToSupabase = async (tokenValue: string, userId: string) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ device_token: tokenValue })
          .eq('id', userId);
        if (error) {
          console.error('[Push] Token save error:', error);
        } else {
          console.log('[Push] Token saved for user:', userId);
        }
      } catch (err) {
        console.error('[Push] Token save exception:', err);
      }
    };

    const initPush = async () => {
      try {
        const permission = await PushNotifications.requestPermissions();
        if (permission.receive !== 'granted') {
          console.log('[Push] Permission denied');
          return;
        }
        await PushNotifications.register();
      } catch (err) {
        // Firebase not yet configured (google-services.json missing) — silent fail
        console.warn('[Push] Registration failed (Firebase may not be configured):', err);
      }
    };

    initPush();

    const regListener = PushNotifications.addListener(
      'registration',
      async (token: any) => {
        console.log('[Push] FCM Token:', token.value);
        lastToken = token.value;
        localStorage.setItem('capacitor_device_token', token.value);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await saveTokenToSupabase(token.value, user.id);
        }
      }
    );

    const regErrorListener = PushNotifications.addListener(
      'registrationError',
      (err: any) => {
        console.error('[Push] Registration error:', JSON.stringify(err));
      }
    );

    const notificationListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: any) => {
        console.log('[Push] Notification received:', JSON.stringify(notification));
      }
    );

    const actionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: any) => {
        console.log('[Push] Action performed:', JSON.stringify(action));
      }
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && lastToken) {
          await saveTokenToSupabase(lastToken, session.user.id);
        }
      }
    );

    return () => {
      regListener.remove();
      regErrorListener.remove();
      notificationListener.remove();
      actionListener.remove();
      subscription.unsubscribe();
    };
  }, [supabase]);

  return null;
}
