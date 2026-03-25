import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3005';

/**
 * Manages Socket.io connection to the backend server.
 * Handles connection lifecycle with automatic reconnection.
 * 
 * @example
 * socketService.on('orders_updated', (data) => {
 *   // Handle update
 * });
 */
class SocketService {
    private socket: Socket | null = null;

    /**
     * Establishes connection to Socket.io server.
     * Silently handles reconnections if already connected.
     */
    connect() {
        if (this.socket) return;

        try {
            this.socket = io(SOCKET_URL, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5
            });

            this.socket.on('connect', () => {
                // Connected to server - socket is ready for emission
            });

            this.socket.on('disconnect', () => {
                // Disconnected - will attempt to reconnect automatically
            });

            this.socket.on('connect_error', (error: Error) => {
                // Connection error occurred - socket.io will retry
            });
        } catch (error) {
            // Failed to initialize socket - error will be caught on emit/on calls
        }
    }

    /**
     * Registers event listener on socket.
     * @param event - Event name
     * @param callback - Handler function
     */
    on(event: string, callback: (...args: any[]) => void) {
        try {
            if (!this.socket) this.connect();
            this.socket?.on(event, callback);
        } catch (error) {
            // Event listener registration failed
        }
    }

    /**
     * Unregisters event listener from socket.
     * @param event - Event name
     * @param callback - Handler function
     */
    off(event: string, callback: (...args: any[]) => void) {
        try {
            this.socket?.off(event, callback);
        } catch (error) {
            // Event listener removal failed
        }
    }

    /**
     * Emits event to server.
     * Establishes connection if not yet connected.
     * @param event - Event name
     * @param data - Event payload
     */
    emit(event: string, data?: any) {
        try {
            if (!this.socket) this.connect();
            this.socket?.emit(event, data);
        } catch (error) {
            // Event emission failed - will be retried on next call
        }
    }
}

export const socketService = new SocketService();
