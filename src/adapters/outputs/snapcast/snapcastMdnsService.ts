import { createLogger } from '@/shared/logging/logger';
import type { HttpServerConfig } from '@/config/http';
import type { ConfigPort } from '@/ports/ConfigPort';
import type { MdnsPort } from '@/ports/MdnsPort';
import { systemNameToHostname } from '@/shared/utils/net';
import { SnapcastMdnsAdvertiser } from '@/adapters/outputs/snapcast/snapcastMdnsAdvertiser';
import type { MdnsLifecycleService } from '@/adapters/discovery/mdnsLifecycle';

type SnapcastPortProvider = {
  getSnapcastAdvertisePort: () => number | null;
};

export class SnapcastMdnsService implements MdnsLifecycleService {
  private readonly log = createLogger('Discovery', 'SnapcastMdns');
  private readonly advertiser: SnapcastMdnsAdvertiser;
  private started = false;

  constructor(
    private readonly config: HttpServerConfig,
    private readonly configPort: ConfigPort,
    private readonly portProvider: SnapcastPortProvider,
    mdns: MdnsPort,
  ) {
    this.advertiser = new SnapcastMdnsAdvertiser(mdns);
  }

  public start(): void {
    if (this.started) {
      return;
    }
    const systemName = this.configPort.getSystemConfig()?.audioserver?.name || 'Lox Audio Server';
    const systemIp = this.configPort.getSystemConfig()?.audioserver?.ip?.trim() || undefined;
    const streamPort = this.portProvider.getSnapcastAdvertisePort();
    if (!streamPort) {
      this.log.warn('Snapcast mdns skipped (tcp server not listening)');
      return;
    }
    this.advertiser.advertise({
      name: systemName,
      host: systemNameToHostname(systemName) + '-snapcast',
      streamPort,
      httpPort: this.config.port,
      restrictedAddress: systemIp,
    });
    this.started = true;
  }

  public stop(): void {
    if (!this.started) {
      return;
    }
    this.advertiser.stop();
    this.started = false;
  }
}
