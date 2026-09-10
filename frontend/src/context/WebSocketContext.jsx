import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { playOrderReadyChime } from '../components/AudioBuzzer';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const orderCallbacks = useRef(new Map()); // token -> Set of callbacks
  const kitchenCallbacks = useRef(new Set());
  const [buzzerEnabled, setBuzzerEnabled] = useState(true);

  useEffect(() => {
    let reconnectTimeout = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In Vite proxy setup or direct port 5000:
      const host = window.location.port === '3000' ? `${window.location.hostname}:5000` : window.location.host;
      const wsUrl = `${protocol}//${host}/ws/orders`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          console.log('[WebSocket] Connected to live order telemetry server');
          // Re-subscribe to any active tokens
          for (const token of orderCallbacks.current.keys()) {
            ws.send(JSON.stringify({ type: 'SUBSCRIBE_ORDER', token }));
          }
          if (kitchenCallbacks.current.size > 0) {
            ws.send(JSON.stringify({ type: 'SUBSCRIBE_KITCHEN' }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Trigger buzzer chime if order status turned to READY
            if (data.status === 'READY' || data.isReadyAlert) {
              if (buzzerEnabled) {
                playOrderReadyChime();
              }
            }

            // Route to order callbacks
            if (data.token && orderCallbacks.current.has(data.token)) {
              for (const cb of orderCallbacks.current.get(data.token)) {
                cb(data);
              }
            }

            // Route to kitchen callbacks
            for (const cb of kitchenCallbacks.current) {
              cb(data);
            }
          } catch (err) {
            console.error('Error handling WS event:', err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
          console.warn('WS error, retrying...', err.message);
          ws.close();
        };
      } catch (e) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [buzzerEnabled]);

  const subscribeOrder = (token, callback) => {
    if (!token) return () => {};
    if (!orderCallbacks.current.has(token)) {
      orderCallbacks.current.set(token, new Set());
    }
    orderCallbacks.current.get(token).add(callback);

    // Send subscribe message to backend
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SUBSCRIBE_ORDER', token }));
    }

    return () => {
      if (orderCallbacks.current.has(token)) {
        orderCallbacks.current.get(token).delete(callback);
      }
    };
  };

  const subscribeKitchen = (callback) => {
    kitchenCallbacks.current.add(callback);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SUBSCRIBE_KITCHEN' }));
    }

    return () => {
      kitchenCallbacks.current.delete(callback);
    };
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        buzzerEnabled,
        setBuzzerEnabled,
        subscribeOrder,
        subscribeKitchen,
        playChime: playOrderReadyChime
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useOrderTelemetry() {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useOrderTelemetry must be used within a WebSocketProvider');
  return context;
}
