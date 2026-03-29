import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for WebSocket connection to real-time dashboard
 * Automatically connects, reconn ects, and sends periodic pings
 * 
 * @param {string} userId - User ID for WebSocket connection
 * @returns {object} WebSocket data and connection state
 */
export const useWebSocket = (userId) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);
  const connectionAttempts = useRef(0);

  // Construct WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    // Get API URL from environment, fallback to localhost
    let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    // Convert http:// to ws:// or https:// to wss://
    const wsUrl = apiUrl
      .replace(/^https:/, 'wss:')
      .replace(/^http:/, 'ws:');
    
    return `${wsUrl}/ws/dashboard/${userId}`;
  }, [userId]);

  // Send periodic pings to keep connection alive
  const startPingInterval = useCallback(() => {
    if (pingTimer.current) clearInterval(pingTimer.current);
    
    pingTimer.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!userId) {
      console.warn('⚠️ useWebSocket: userId not provided');
      return;
    }

    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    try {
      const wsUrl = getWebSocketUrl();
      connectionAttempts.current += 1;
      
      console.log(`🔌 WebSocket connecting (attempt ${connectionAttempts.current}): ${wsUrl}`);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setError(null);
        connectionAttempts.current = 0;
        
        // Start ping interval
        startPingInterval();
        
        // Send initial ping
        ws.current.send(JSON.stringify({ type: 'ping' }));
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'dashboard_update') {
            console.log('📊 Dashboard update received');
            setData(message);
            setLastUpdate(new Date().toLocaleTimeString());
          } else if (message.type === 'global_update') {
            console.log('🌍 Global update received');
            setData(message);
            setLastUpdate(new Date().toLocaleTimeString());
          } else if (message.type === 'connection') {
            console.log(`✅ Connected as: ${message.user_name} (${message.user_type})`);
            setData(prev => ({ ...prev, ...message }));
          } else if (message.type === 'pong') {
            console.log('🔔 Pong received');
          } else if (message.type === 'user_disconnected') {
            console.log(`👋 User ${message.user_name} disconnected`);
          } else {
            console.log('📨 WebSocket message:', message.type);
            setData(message);
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err, event.data);
        }
      };

      ws.current.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnected(false);
      };

      ws.current.onclose = () => {
        console.log('⚠️ WebSocket disconnected');
        setIsConnected(false);
        
        if (pingTimer.current) clearInterval(pingTimer.current);
        
        // Attempt to reconnect after 3 seconds (max 5 attempts)
        if (connectionAttempts.current < 5) {
          reconnectTimer.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connect();
          }, 3000);
        } else {
          setError('Failed to connect after multiple attempts');
          console.error('❌ Max reconnection attempts reached');
        }
      };
    } catch (err) {
      console.error('❌ Error creating WebSocket:', err);
      setError(err.message);
    }
  }, [userId, getWebSocketUrl, startPingInterval]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket...');
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setIsConnected(false);
    setData(null);
  }, []);

  // Send message through WebSocket
  const send = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      console.log('📤 Message sent:', message.type);
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }, []);

  // Effect: Connect on mount, disconnect on unmount
  useEffect(() => {
    if (userId) {
      console.log(`🚀 Initializing WebSocket for user: ${userId}`);
      connect();
    }

    return () => {
      console.log('🧹 Cleaning up WebSocket hook');
      disconnect();
    };
  }, [userId, connect, disconnect]);

  return {
    data,
    isConnected,
    error,
    lastUpdate,
    send,
    disconnect,
    connectionAttempts: connectionAttempts.current
  };
};

export default useWebSocket;
