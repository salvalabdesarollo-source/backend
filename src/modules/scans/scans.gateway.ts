import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Scan } from './scan.entity';

export type ScanEventAction =
  | 'created'
  | 'updated'
  | 'assigned'
  | 'unassigned'
  | 'scanned';

// Configurar path del socket basado en BASE_PATH si existe
const basePath = process.env.BASE_PATH || '';
const socketPath = basePath 
  ? `${basePath}/socket.io/`.replace(/\/\//g, '/') // Evitar doble slash
  : '/socket.io/';

@WebSocketGateway({
  path: socketPath,
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
export class ScansGateway {
  @WebSocketServer()
  server: Server;

  emitScanEvent(action: ScanEventAction, scan: Scan): void {
    this.server.emit('scans.event', { action, scan });
    this.server.emit(`scans.${action}`, scan);
  }
}
