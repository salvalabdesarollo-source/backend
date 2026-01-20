import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Scan } from './scan.entity';

export type ScanEventAction =
  | 'created'
  | 'updated'
  | 'assigned'
  | 'unassigned'
  | 'scanned';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ScansGateway {
  @WebSocketServer()
  server: Server;

  emitScanEvent(action: ScanEventAction, scan: Scan): void {
    this.server.emit('scans.event', { action, scan });
    this.server.emit(`scans.${action}`, scan);
  }
}
