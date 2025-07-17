
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from './app-provider';
import { Client, type IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  date: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const WS_URL = 'http://localhost:8080/ws-notifications';
const MAX_NOTIFICATIONS = 50;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentUser } = useApp();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stompClient, setStompClient] = useState<Client | null>(null);

  useEffect(() => {
    if (isAuthenticated && currentUser && !stompClient) {
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame: IFrame) => {
          console.log('Connected to WebSocket:', frame);

          // Subscribe to user-specific notifications
          client.subscribe(`/topic/${currentUser.id}`, (message) => {
            const newNotif = JSON.parse(message.body);
            addNotification(newNotif);
          });
          
          // Subscribe to global notifications
          client.subscribe('/app', (message) => {
            const newNotif = JSON.parse(message.body);
            addNotification(newNotif);
          });
        },
        onStompError: (frame: IFrame) => {
          console.error('Broker reported error: ' + frame.headers['message']);
          console.error('Additional details: ' + frame.body);
        },
        onWebSocketError: (error) => {
            console.error('WebSocket Error', error);
        },
      });

      client.activate();
      setStompClient(client);
    } else if (!isAuthenticated && stompClient) {
      stompClient.deactivate();
      setStompClient(null);
      setNotifications([]);
    }

    return () => {
      if (stompClient?.active) {
        stompClient.deactivate();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser]);

  const addNotification = (notif: Omit<Notification, 'read'>) => {
    const newNotification: Notification = { ...notif, read: false, date: new Date().toISOString() };
    setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
    toast({
        title: newNotification.title,
        description: newNotification.message,
    });
  };

  const markAsRead = useCallback((id?: number) => {
    setNotifications(prev =>
      prev.map(n => (id === undefined || n.id === id) ? { ...n, read: true } : n)
    );
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
