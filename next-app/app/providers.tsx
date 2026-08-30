"use client";

import { PushNotificationProvider, NotificationPermissionBanner } from "./components/PushNotificationProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PushNotificationProvider>
      {children}
      <NotificationPermissionBanner />
    </PushNotificationProvider>
  );
}
