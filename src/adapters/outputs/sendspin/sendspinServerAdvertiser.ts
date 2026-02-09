import type { HttpServerConfig } from '@/config/http';
import type { ConfigPort } from '@/ports/ConfigPort';
import { systemNameToHostname } from '@/shared/utils/net';
import type { SendspinClientConnector } from '@/adapters/outputs/sendspin/sendspinClientConnector';
import type { MdnsLifecycleService } from '@/adapters/discovery/mdnsLifecycle';

export class SendspinServerAdvertiser implements MdnsLifecycleService {
  private started = false;

  constructor(
    private readonly config: HttpServerConfig,
    private readonly configPort: ConfigPort,
    private readonly connector: SendspinClientConnector,
  ) {}

  public start(): void {
    if (this.started) {
      return;
    }
    const systemName = this.configPort.getSystemConfig()?.audioserver?.name || 'Lox Audio Server';
    const systemIp = this.configPort.getSystemConfig()?.audioserver?.ip?.trim() || undefined;
    this.connector.advertiseServer({
      name: systemName + ' - Sendspin',
      host: systemNameToHostname(systemName) + '-sendspin',
      port: this.config.port,
      restrictedAddress: systemIp,
      path: '/sendspin',
    });
    this.started = true;
  }

  public stop(): void {
    if (!this.started) {
      return;
    }
    this.connector.stopAdvertising();
    this.started = false;
  }
}
