
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from './app-provider';
import { Client, type IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useToast } from '@/hooks/use-toast';
import type { CommandeStatus } from '@/lib/types';

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

const WS_URL = process.env.NEXT_PUBLIC_WS_URL!;

const MAX_NOTIFICATIONS = 50;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentUser, updateCommandeStatus } = useApp();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stompClient, setStompClient] = useState<Client | null>(null);

  const addNotification = useCallback((notif: Omit<Notification, 'read' | 'date' | 'id'> & { id?: number }) => {
    const newNotification: Notification = {
      id: notif.id ?? Date.now(),
      title: notif.title,
      message: notif.message,
      read: false,
      date: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
    toast({
        title: newNotification.title,
        description: newNotification.message,
    });
  }, [toast]);


  useEffect(() => {
    if (isAuthenticated && currentUser && !stompClient) {
      const token = localStorage.getItem('stockhero_token');
      
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: {
            Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame: IFrame) => {
          console.log('STOMP: Connected to WebSocket', frame);

          const roleTopic = `/topic/${currentUser.roleNom.toLowerCase()}`;
          console.log(`STOMP: Subscribing to role-specific topic: ${roleTopic}`);
          
          client.subscribe(roleTopic, (message) => {
            console.log(`STOMP: Received message on ${roleTopic}`, message.body);
             try {
              const messageBody = message.body;
              let title = 'Nouvelle Notification';
              let content = messageBody;
              
              const parts = messageBody.split(':');
              if (parts.length > 1) {
                title = parts[0].trim();
                content = parts.slice(1).join(':').trim();
              }
              
              const newNotif = { title, message: content };
              addNotification(newNotif);

            } catch (e) {
              console.error("STOMP: Failed to process notification message", e);
            }
          });
          
          if (currentUser.clientId) {
            const clientTopic = `/topic/client/${currentUser.clientId}`;
            console.log(`STOMP: Subscribing to client-specific topic: ${clientTopic}`);

            client.subscribe(clientTopic, (message) => {
                console.log(`STOMP: Received message on ${clientTopic}`, message.body);
                try {
                    const payload = JSON.parse(message.body);
                    if (payload.type === 'update' && payload.info && payload.info.id && payload.info.status) {
                        addNotification({
                            title: 'Mise à jour Commande',
                            message: payload.message,
                        });
                        updateCommandeStatus(payload.info.id, payload.info.status as CommandeStatus);
                    }
                } catch (e) {
                    console.error("STOMP: Failed to process client notification", e);
                }
            });
          }
        },
        onStompError: (frame: IFrame) => {
          console.error('STOMP: Broker reported error: ' + frame.headers['message']);
          console.error('STOMP: Additional details: ' + frame.body);
        },
        onWebSocketError: (error) => {
            console.error('STOMP: WebSocket Error', error);
        },
        onDisconnect: () => {
            console.log('STOMP: Disconnected from WebSocket');
        }
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
  }, [isAuthenticated, currentUser, stompClient, addNotification, updateCommandeStatus]);


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
