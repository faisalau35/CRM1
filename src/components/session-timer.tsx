"use client";

import { useState, useEffect } from 'react';
import { Badge, Text, Tooltip } from '@mantine/core';
import { useSession } from 'next-auth/react';

const SESSION_DURATION = 30 * 60; // 30 minutes in seconds

export default function SessionTimer() {
  const { data: session } = useSession();
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  
  useEffect(() => {
    if (!session) return;
    
    // Start countdown
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    // Reset countdown on user activity
    const resetTimer = () => {
      setTimeLeft(SESSION_DURATION);
    };
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });
    
    return () => {
      clearInterval(interval);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [session]);
  
  if (!session) return null;
  
  // Format the time remaining
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Determine color based on time left
  let color = 'green';
  if (timeLeft < 300) { // Less than 5 minutes
    color = 'red';
  } else if (timeLeft < 600) { // Less than 10 minutes
    color = 'orange';
  }
  
  return (
    <Tooltip label="Session expires after 30 minutes of inactivity" position="bottom">
      <Badge color={color} variant="light" size="sm">
        <Text size="xs" fw={500}>Session: {formattedTime}</Text>
      </Badge>
    </Tooltip>
  );
} 