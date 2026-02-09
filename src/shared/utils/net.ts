import { networkInterfaces } from 'node:os';

export function defaultLocalIp(): string {
  let nets: ReturnType<typeof networkInterfaces>;
  try {
    nets = networkInterfaces();
  } catch {
    // Some restricted runtimes (tests/containers) can throw here; fall back to empty.
    return '';
  }
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (!net || net.internal) {
        continue;
      }
      if (net.family === 'IPv4' && net.address) {
        return net.address;
      }
    }
  }
  return '';
}

export function systemNameToHostname(systemName: string) {
  let hostname = systemName.toLowerCase();
  hostname = hostname.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  hostname = hostname.replace(/[^a-z0-9.-]/g, '-');
  hostname = hostname.replace(/-+/g, '-');
  hostname = hostname.replace(/\.+/g, '.');
  hostname = hostname.replace(/^[-.]+|[-.]+$/g, '');
  hostname = hostname
    .split('.')
    .map(label => label.slice(0, 63))
    .join('.');

  if (hostname.length > 253) {
    hostname = hostname.slice(0, 253);
  }

  return hostname;
}
