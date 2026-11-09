/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_GATEWAY_URL?: string;
  readonly VITE_MFE_ENTRENAMIENTO_URL?: string;
  readonly VITE_MFE_CLIENTES_URL?: string;
  readonly VITE_MFE_INVENTARIO_URL?: string;
  readonly VITE_MFE_GIMNASIO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'single-spa' {
  export interface LifeCycles<T = any> {
    bootstrap?: (props: T) => Promise<any>;
    mount?: (props: T) => Promise<any>;
    unmount?: (props: T) => Promise<any>;
    update?: (props: T) => Promise<any>;
  }

  export function registerApplication(config: {
    name: string;
    app: () => Promise<LifeCycles | any>;
    activeWhen: string | ((location: Location) => boolean) | Array<string | ((location: Location) => boolean)>;
    customProps?: Record<string, any> | ((name: string, location: Location) => Record<string, any>);
  }): void;

  export function start(opts?: { urlRerouteOnly?: boolean }): void;
}


