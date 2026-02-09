import Bonjour from 'bonjour-service';
import { createLogger } from '@/shared/logging/logger';
import type {
  MdnsBrowseOptions,
  MdnsBrowser,
  MdnsPort,
  MdnsPublishOptions,
  MdnsRegistration,
  MdnsServiceRecord,
} from '@/ports/MdnsPort';
import ciao, { Protocol } from '@homebridge/ciao';

export class MdnsService implements MdnsPort {
  private readonly log = createLogger('Discovery', 'Mdns');
  private readonly bonjour = new Bonjour();
  private readonly responder = ciao.getResponder();

  public async publish(options: MdnsPublishOptions, onRegistration: (registration: MdnsRegistration) => void) {
    const service = this.responder.createService({
      name: options.name ?? 'Lox Audio Server',
      type: options.type,
      protocol: options.protocol === 'udp' ? Protocol.UDP : Protocol.TCP,
      hostname: options.host,
      port: options.port,
      restrictedAddresses: options.restrictedAddress ? [options.restrictedAddress] : undefined,
      txt: options.txt,
    });

    service.advertise()
      .then(() => onRegistration(
        {
          stop: () => {
            service.end().catch(error => {
              const message = error instanceof Error ? error.message : String(error);
              this.log.debug('mdns unpublish failed', { message, type: options.type });
            });
          },
        }),
      );
  }

  public browse(
    options: MdnsBrowseOptions,
    onService: (service: MdnsServiceRecord) => void,
  ): MdnsBrowser {
    const browser = this.bonjour.find(
      { type: options.type, protocol: options.protocol ?? 'tcp' },
      (service) => onService(service as MdnsServiceRecord),
    );
    browser.start();
    return {
      stop: () => {
        try {
          browser.stop?.();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.log.debug('mdns browse stop failed', { message, type: options.type });
        }
      },
    };
  }

  public shutdown(): void {
    this.responder.shutdown()
      .then(() => {
        try {
          this.bonjour.destroy?.();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.log.debug('mdns shutdown failed', { message });
        }
      })
      .catch(error => {
        const message = error instanceof Error ? error.message : String(error);
        this.log.debug('mdns shutdown failed', { message });
      });
  }
}
