import { createLogger } from '@/shared/logging/logger';
import type { MdnsPort, MdnsRegistration } from '@/ports/MdnsPort';

type SnapcastAdvertiseOptions = {
  name: string;
  host?: string;
  streamPort: number;
  httpPort: number;
  restrictedAddress?: string;
};

export class SnapcastMdnsAdvertiser {
  private readonly log = createLogger('Http', 'SnapcastMdns');
  private streamRegistration: MdnsRegistration | null = null;
  private httpRegistration: MdnsRegistration | null = null;

  constructor(private readonly mdns: MdnsPort) {}

  public advertise(options: SnapcastAdvertiseOptions): void {
    this.stop();
    const host = options.host;
    const name = options.name + ' - Snapcast Server';
    this.mdns.publish({
      name,
      type: 'snapcast',
      protocol: 'tcp',
      host,
      port: options.streamPort,
      restrictedAddress: options.restrictedAddress,
    }, registration => {
      this.streamRegistration = registration;
      this.log.info('Snapcast Server service advertised via mDNS', {
        name,
        host,
        streamPort: options.streamPort,
      });
    });
    const httpName = options.name + ' - Snapcast HTTP API';
    this.mdns.publish({
      name: httpName,
      type: 'snapcast-http',
      protocol: 'tcp',
      host: host + '-http',
      port: options.httpPort,
      restrictedAddress: options.restrictedAddress,
    }, registration => {
      this.httpRegistration = registration;
      this.log.info('Snapcast HTTP API service advertised via mDNS', {
        name: httpName,
        host,
        httpPort: options.httpPort,
      });
    });
  }

  public stop(): void {
    this.streamRegistration?.stop();
    this.httpRegistration?.stop();
    this.streamRegistration = null;
    this.httpRegistration = null;
  }
}
