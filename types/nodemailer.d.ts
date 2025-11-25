declare module 'nodemailer' {
    import type { SentMessageInfo, TransportOptions, Transport } from 'nodemailer';
  
    export function createTransport(options: TransportOptions): Transport;
  
    export type Transporter = Transport;
    const nodemailer: {
      createTransport: (options: TransportOptions) => Transport;
    };
  
    export default nodemailer;
  }
  