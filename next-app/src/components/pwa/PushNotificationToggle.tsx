'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellRing, BellOff, RefreshCw, Check } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const PushNotificationToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(Boolean(subscription));
        });
      });
    }
  }, []);

  const handleToggle = async () => {
    if (!isSupported) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const registration = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        // Unsubscribe
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await fetch('/api/v1/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          await subscription.unsubscribe();
        }
        setIsSubscribed(false);
        setStatusMessage('Push alerts turned off');
      } else {
        // Request permission on explicit user action
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setStatusMessage('Notification permission was denied');
          setIsLoading(false);
          return;
        }

        // Fetch public VAPID key
        const keyRes = await fetch('/api/v1/push/subscribe');
        const keyData = await keyRes.json();
        const publicKey = keyData.publicKey;

        if (!publicKey) {
          throw new Error('Public VAPID key missing');
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        // Register with backend
        await fetch('/api/v1/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            userAgent: navigator.userAgent,
          }),
        });

        setIsSubscribed(true);
        setStatusMessage('Deadline & decision alerts enabled!');
      }
    } catch (err: any) {
      console.error('[PushToggle Error]:', err);
      setStatusMessage(err.message || 'Error configuring notifications');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  if (!isSupported) {
    return null;
  }

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        title={isSubscribed ? 'Disable Push Alerts' : 'Enable Deadline & Decision Alerts'}
        className={`p-2 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
          isSubscribed
            ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
        aria-label="Toggle push notifications"
      >
        {isLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          <BellRing className="w-4 h-4 text-indigo-600" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isSubscribed ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
        }`}>
          {isSubscribed ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </div>
        <div>
          <div className="text-xs font-bold text-slate-800">
            {isSubscribed ? 'Push Notifications Active' : 'Enable Mobile Push Alerts'}
          </div>
          <div className="text-[11px] text-slate-500">
            {statusMessage || 'Deadlines, evaluations, blockers & messages only (anti-spam).'}
          </div>
        </div>
      </div>

      <button
        id="btn-toggle-push"
        onClick={handleToggle}
        disabled={isLoading}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[44px] transition-all flex items-center gap-1.5 ${
          isSubscribed
            ? 'bg-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
        }`}
      >
        {isLoading ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : isSubscribed ? (
          <span>Disable</span>
        ) : (
          <>
            <Bell className="w-3.5 h-3.5" />
            <span>Turn On</span>
          </>
        )}
      </button>
    </div>
  );
};
