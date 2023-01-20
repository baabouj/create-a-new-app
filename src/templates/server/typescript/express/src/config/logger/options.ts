import { randomUUID } from 'crypto';
import pino from 'pino';
import type { Options } from 'pino-http';

import { isProduction } from '$/utils';

const devOptions: Options = {
  quietReqLogger: true, // turn off the default logging output
  transport: {
    target: 'pino-http-print', // use the pino-http-print transport and its formatting output
    options: {
      destination: 1,
      all: true,
      translateTime: true,
    },
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    }
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent';
    }
    return 'info';
  },
};

const prodOptions: Options = {
  autoLogging: false,

  customProps: (req: any) => ({
    host_ip: req.socket.localAddress,
    request_id: randomUUID(),
    request_method: req.method,
    request_uri: req.url,
    source_ip: req.ip,
    protocol: req.protocol,
    port: req.socket.localPort,
    useragent: req.headers['user-agent'],
  }),

  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
    bindings: ({ hostname }) => ({ hostname }),
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  genReqId: () => randomUUID(),

  serializers: {
    req: () => undefined,
    res: () => undefined,
  },

  customAttributeKeys: {
    responseTime: 'response_time',
  },

  messageKey: 'description',
  // stream: pino.destination('./combined.log'),
};

const options = isProduction?.() ? prodOptions : devOptions;

export { options };
