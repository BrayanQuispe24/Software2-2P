import { ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

let appRef: ApplicationRef | null = null;
let domElement: HTMLElement | null = null;

/**
 * Ciclo de vida single-spa: Bootstrap
 */
export async function bootstrap(props: any): Promise<void> {
  console.log('[single-spa:mfe-inventario] Bootstrapping Angular MFE...', props);
}

/**
 * Ciclo de vida single-spa: Mount
 */
export async function mount(props: any): Promise<void> {
  console.log('[single-spa:mfe-inventario] Mounting Angular MFE...', props);

  const containerId = 'single-spa-application:@plataforma/inventario';
  domElement = (props && props.domElement) ? props.domElement : document.getElementById(containerId);

  if (!domElement) {
    domElement = document.createElement('div');
    domElement.id = containerId;
    const parent = document.getElementById('microfrontend-container') || document.body;
    parent.appendChild(domElement);
  }

  // Montar elemento raíz de Angular
  domElement.innerHTML = '<app-root></app-root>';

  try {
    appRef = await bootstrapApplication(App, appConfig);
  } catch (err) {
    console.error('[single-spa:mfe-inventario] Error al montar Angular:', err);
  }
}

/**
 * Ciclo de vida single-spa: Unmount
 */
export async function unmount(props: any): Promise<void> {
  console.log('[single-spa:mfe-inventario] Unmounting Angular MFE...', props);

  if (appRef) {
    appRef.destroy();
    appRef = null;
  }

  if (domElement) {
    domElement.innerHTML = '';
  }
}

/**
 * Arranque automático en modo independiente / Standalone (puerto 9104)
 */
if (typeof window !== 'undefined' && !(window as any).singleSpaNavigate) {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}
