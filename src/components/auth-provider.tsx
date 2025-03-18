"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

// Basic auto-logout component
function AutoLogout() {
  const { data: session } = useSession();
  
  useEffect(() => {
    if (!session) return;
    
    // Auto logout after 30 minutes of inactivity
    const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let timeout: NodeJS.Timeout | undefined;
    
    const resetTimeout = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, INACTIVE_TIMEOUT);
    };
    
    // Initialize timeout
    resetTimeout();
    
    // Reset timeout on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimeout();
    };
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });
    
    // Cleanup
    return () => {
      if (timeout) clearTimeout(timeout);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [session]);
  
  // No visible output
  return null;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AutoLogout />
      {children}
    </SessionProvider>
  );
} 