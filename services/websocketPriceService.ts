/**
 * WebSocket Price Service
 *
 * Provides real-time DC price updates via WebSocket connections.
 * Falls back to polling if WebSocket unavailable.
 *
 * Benefits:
 * - Real-time updates (no polling delay)
 * - Reduced API calls
 * - Lower latency
 * - Better user experience
 */

import { PRICE_UPDATE_INTERVAL } from '../constants';

interface WebSocketMessage {
  type: 'price_update' | 'pool_update' | 'error';
  data: {
    price: number;
    source: 'pool' | 'dexscreener' | 'geckoterminal';
    timestamp: number;
  };
}

interface PriceUpdateCallback {
  (price: number, source: string): void;
}

class WebSocketPriceService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;
  private callbacks: Set<PriceUpdateCallback> = new Set();
  private connected = false;
  private manualClose = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  // WebSocket server endpoint - configure via environment variable
  // If not set, service will use polling fallback instead
  private wsUrl = import.meta.env.VITE_WS_PRICE_URL || '';

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.connected || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // If no WebSocket URL configured, use polling fallback immediately
    if (!this.wsUrl) {
      console.warn('[WebSocketPrice] No WebSocket URL configured (VITE_WS_PRICE_URL not set), using polling fallback');
      this.startPolling();
      return;
    }

    try {
      console.log('[WebSocketPrice] Connecting to', this.wsUrl);
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocketPrice] Connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Stop polling when WebSocket connects
        this.stopPolling();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[WebSocketPrice] Failed to parse message:', error);
        }
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log('[WebSocketPrice] Disconnected', event.code, event.reason);
        this.connected = false;
        this.ws = null;

        // Attempt to reconnect if not manually closed
        if (!this.manualClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocketPrice] Error:', error);
        this.connected = false;
      };
    } catch (error) {
      console.error('[WebSocketPrice] Connection failed:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.manualClose = true;
    this.stopPolling();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
  }

  /**
   * Schedule reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocketPrice] Max reconnect attempts reached');
      this.startPolling(); // Fall back to polling
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[WebSocketPrice] Reconnecting in ${delay}ms ` +
      `(attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'price_update':
        this.notifyCallbacks(message.data.price, message.data.source);
        break;

      case 'pool_update':
        this.notifyCallbacks(message.data.price, 'pool');
        break;

      case 'error':
        console.error('[WebSocketPrice] Server error:', message.data);
        break;

      default:
        console.warn('[WebSocketPrice] Unknown message type:', message.type);
    }
  }

  /**
   * Start polling as fallback
   */
  private startPolling(): void {
    if (this.pollingInterval) {
      return; // Already polling
    }

    console.log('[WebSocketPrice] Starting polling fallback');

    // Import here to avoid circular dependency
    import('./priceOracleService').then(({ priceOracleService }) => {
      this.pollingInterval = setInterval(async () => {
        try {
          const price = await priceOracleService.getCurrentPrice();
          const source = priceOracleService.getPriceSource().source;
          this.notifyCallbacks(price, source);
        } catch (error) {
          console.error('[WebSocketPrice] Polling error:', error);
        }
      }, PRICE_UPDATE_INTERVAL);
    });
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[WebSocketPrice] Stopped polling');
    }
  }

  /**
   * Notify all registered callbacks
   */
  private notifyCallbacks(price: number, source: string): void {
    this.callbacks.forEach(callback => {
      try {
        callback(price, source);
      } catch (error) {
        console.error('[WebSocketPrice] Callback error:', error);
      }
    });
  }

  /**
   * Subscribe to price updates
   * Returns unsubscribe function
   */
  subscribe(callback: PriceUpdateCallback): () => void {
    this.callbacks.add(callback);

    // Auto-connect on first subscriber
    if (this.callbacks.size === 1) {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);

      // Disconnect if no more subscribers
      if (this.callbacks.size === 0) {
        this.disconnect();
      }
    };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    polling: boolean;
  } {
    return {
      connected: this.connected,
      reconnectAttempts: this.reconnectAttempts,
      polling: this.pollingInterval !== null
    };
  }

  /**
   * Manually send a price update (for testing)
   */
  sendPriceUpdate(price: number, source: string): void {
    if (this.connected && this.ws) {
      const message: WebSocketMessage = {
        type: 'price_update',
        data: { price, source: source as 'pool' | 'dexscreener' | 'geckoterminal', timestamp: Date.now() }
      };
      this.ws.send(JSON.stringify(message));
    }
  }
}

// Singleton instance
export const webSocketPriceService = new WebSocketPriceService();

// Export class for testing
export { WebSocketPriceService };
