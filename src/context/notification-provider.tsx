

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from './app-provider';
import { Client, type IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useToast } from '@/hooks/use-toast';
import type { CommandeStatus, Notification } from '@/lib/types';
import * as api from '@/lib/api';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;
const MAX_NOTIFICATIONS = 50;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentUser, refreshAllData } = useApp();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stompClient, setStompClient] = useState<Client | null>(null);

  const processNotificationPayload = useCallback((payload: any) => {
      const newNotification: Notification = {
          id: payload.id ?? Date.now(),
          type: payload.type,
          message: payload.message,
          userId: payload.userId,
          date: payload.date || new Date().toISOString(),
          lu: payload.lu || false,
          commandeId: payload.commandeId,
          statut: payload.statut,
      };

      setNotifications(prev => [newNotification, ...prev]
          .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
          .slice(0, MAX_NOTIFICATIONS));

      if (newNotification.message) {
        toast({
            title: newNotification.type || 'Nouvelle Notification',
            description: newNotification.message,
        });
      }

      refreshAllData();

  }, [toast, refreshAllData]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (!WS_URL) {
        console.error("STOMP: WebSocket URL is not configured. Please set NEXT_PUBLIC_WS_URL in your environment variables.");
        return;
      }

      api.getNotificationsByUserId(currentUser.id)
        .then(history => {
            if (history) {
              const sortedHistory = history.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
              setNotifications(sortedHistory);
            }
        })
        .catch(err => console.error("Failed to fetch notification history", err));

      const token = localStorage.getItem('stockhero_token');
      
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL, null, { transports: ['websocket'] }),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame: IFrame) => {
          console.log('STOMP: Connected successfully.');
          
          const topics = ['/app'];
          if (currentUser.roleNom) {
            topics.push(`/topic/${currentUser.roleNom.toLowerCase()}`);
          }
          if (currentUser.clientId) {
            topics.push(`/topic/client/${currentUser.clientId}`);
          }
          
          console.log(`STOMP: Subscribing to topics: ${topics.join(', ')}`);
          topics.forEach(topic => {
            client.subscribe(topic, (message) => {
              console.log(`STOMP: Received message on ${topic}`);
              try {
                const payload = JSON.parse(message.body);
                processNotificationPayload(payload);
              } catch (e) {
                console.error(`STOMP: Failed to process notification from ${topic}`, e);
              }
            });
          });
        },
        onStompError: (frame: IFrame) => console.error('STOMP: Broker reported error: ' + frame.headers['message'] + '. Details: ' + frame.body),
        onWebSocketError: (error) => console.error('STOMP: WebSocket connection error', error),
        onDisconnect: () => console.log('STOMP: Disconnected.'),
      });

      client.activate();
      setStompClient(client);

    } else {
        if (stompClient?.active) {
            stompClient.deactivate();
        }
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


  const markAsRead = useCallback((id?: number) => {
    if (id === undefined) {
      // Mark all as read
      const unreadIds: number[] = [];
      const updatedNotifications = notifications.map(n => {
        if (!n.lu) {
          if (n.id) unreadIds.push(n.id);
          return { ...n, lu: true };
        }
        return n;
      });
      setNotifications(updatedNotifications);
      unreadIds.forEach(notifId => api.markNotificationAsRead(notifId).catch(err => console.error(`Failed to mark notification ${notifId} as read`, err)));
    } else {
      // Mark a single notification as read
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, lu: true } : n))
      );
      api.markNotificationAsRead(id).catch(err => console.error(`Failed to mark notification ${id} as read`, err));
    }
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.lu).length;
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
