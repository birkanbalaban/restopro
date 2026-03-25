import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3005';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket) return;

        this.socket = io(SOCKET_URL);

        this.socket.on('connect', () => {
            // Connected to local server via Socket.io
        });

        this.socket.on('disconnect', () => {
            // Disconnected from local server
        });
    }

    on(event: string, callback: (...args: any[]) => void) {
        if (!this.socket) this.connect();
        this.socket?.on(event, callback);
    }

    off(event: string, callback: (...args: any[]) => void) {
        this.socket?.off(event, callback);
    }

    emit(event: string, data?: any) {
        if (!this.socket) this.connect();
        this.socket?.emit(event, data);
    }
}

export const socketService = new SocketService();
