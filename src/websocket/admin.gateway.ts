import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/admin',
  cors: {
    origin: '*', 
  },
})
export class AdminGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  constructor(private jwtService: JwtService, private config: ConfigService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers.authorization?.split(' ')[1];
      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      if (payload.role !== 'ADMIN') {
        client.disconnect(true);
        return;
      }

      client.data.user = payload;
      console.log(`Admin connected: ${payload.id}`);
    } catch {
      client.disconnect(true);
    }
  }

  notifyHouseholdUpdated(data: any) {
    this.server.emit('household_updated', data);
  }
}
