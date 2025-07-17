
// This file is required for TypeScript to recognize the `sockjs-client` module.
declare module 'sockjs-client' {
  import { Url } from 'url';

  interface BaseEvent extends Event {
    type: string;
  }

  interface OpenEvent extends BaseEvent {
    type: 'open';
  }

  interface CloseEvent extends BaseEvent {
    type: 'close';
    code: number;
    reason: string;
    wasClean: boolean;
  }

  interface MessageEvent extends BaseEvent {
    type: 'message';
    data: string;
  }

  type SockJS = WebSocket & {
    protocol: string;
    readyState: number;
    url: string;

    onopen: ((this: SockJS, ev: OpenEvent) => any) | null;
    onclose: ((this: SockJS, ev: CloseEvent) => any) | null;
    onmessage: ((this: SockJS, ev: MessageEvent) => any) | null;

    addEventListener(type: 'open', listener: (this: SockJS, ev: OpenEvent) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: 'close', listener: (this: SockJS, ev: CloseEvent) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: 'message', listener: (this: SockJS, ev: MessageEvent) => any, options?: boolean | AddEventListenerOptions): void;
  };

  interface Options {
    server?: string;
    sessionId?: number | (() => string);
    transports?: string | string[];
    timeout?: number;
  }

  interface SockJSClass {
    new(url: string, _reserved?: any, options?: Options): SockJS;
    (url: string, _reserved?: any, options?: Options): SockJS;
  }

  const SockJS: SockJSClass;
  export = SockJS;
}
