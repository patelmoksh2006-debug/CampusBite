import { WebSocketServer, WebSocket } from 'ws';

class OrderTelemetryServer {
  constructor() {
    this.wss = null;
    this.tokenClients = new Map(); // order_token -> Set of WebSocket clients
    this.kitchenClients = new Set(); // Set of kitchen staff WebSocket clients
  }

  init(server) {
    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on('connection', (ws, req) => {
      let clientToken = null;
      let isKitchenClient = false;

      // Extract query params if available
      try {
        const url = new URL(req.url, 'http://localhost');
        const tokenParam = url.searchParams.get('token');
        const roleParam = url.searchParams.get('role');

        if (tokenParam) {
          clientToken = tokenParam;
          this.subscribeToken(clientToken, ws);
        }
        if (roleParam === 'kitchen_staff' || roleParam === 'admin') {
          isKitchenClient = true;
          this.kitchenClients.add(ws);
        }
      } catch (err) {
        // query parse fail
      }

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'SUBSCRIBE_ORDER') {
            if (clientToken) this.unsubscribeToken(clientToken, ws);
            clientToken = message.token;
            this.subscribeToken(clientToken, ws);
            ws.send(JSON.stringify({ type: 'SUBSCRIBED', token: clientToken }));
          } else if (message.type === 'SUBSCRIBE_KITCHEN') {
            this.kitchenClients.add(ws);
            isKitchenClient = true;
            ws.send(JSON.stringify({ type: 'KITCHEN_SUBSCRIBED' }));
          } else if (message.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG' }));
          }
        } catch (e) {
          console.error('Invalid WS message payload', e);
        }
      });

      ws.on('close', () => {
        if (clientToken) {
          this.unsubscribeToken(clientToken, ws);
        }
        if (isKitchenClient) {
          this.kitchenClients.delete(ws);
        }
      });
    });

    console.log('[WebSocket] Order Telemetry WebSocket Server Initialized at /ws/orders');
  }

  subscribeToken(token, ws) {
    if (!this.tokenClients.has(token)) {
      this.tokenClients.set(token, new Set());
    }
    this.tokenClients.get(token).add(ws);
  }

  unsubscribeToken(token, ws) {
    if (this.tokenClients.has(token)) {
      const set = this.tokenClients.get(token);
      set.delete(ws);
      if (set.size === 0) {
        this.tokenClients.delete(token);
      }
    }
  }

  // Broadcast live status update to student tracking an order
  broadcastOrderUpdate(token, updateData) {
    const payload = JSON.stringify({
      type: 'ORDER_UPDATE',
      token,
      timestamp: new Date().toISOString(),
      ...updateData
    });

    // Notify clients watching this token
    if (this.tokenClients.has(token)) {
      for (const client of this.tokenClients.get(token)) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    }

    // Also notify kitchen clients of status changes
    this.broadcastKitchenEvent({
      type: 'ORDER_STATUS_CHANGED',
      token,
      ...updateData
    });
  }

  // Broadcast event to all kitchen dashboard clients
  broadcastKitchenEvent(eventData) {
    const payload = JSON.stringify({
      ...eventData,
      timestamp: new Date().toISOString()
    });

    for (const client of this.kitchenClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}

export const orderWsServer = new OrderTelemetryServer();
