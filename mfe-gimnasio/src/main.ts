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
  console.log('[single-spa:mfe-gimnasio] Bootstrapping Angular MFE...', props);
}

/**
 * Ciclo de vida single-spa: Mount
 */
export async function mount(props: any): Promise<void> {
  console.log('[single-spa:mfe-gimnasio] Mounting Angular MFE...', props);

  const containerId = 'single-spa-application:@plataforma/gimnasio';
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
    console.error('[single-spa:mfe-gimnasio] Error al montar Angular:', err);
  }
}

/**
 * Ciclo de vida single-spa: Unmount
 */
export async function unmount(props: any): Promise<void> {
  console.log('[single-spa:mfe-gimnasio] Unmounting Angular MFE...', props);

  if (appRef) {
    appRef.destroy();
    appRef = null;
  }

  if (domElement) {
    domElement.innerHTML = '';
  }
}

/**
 * Arranque automático en modo independiente / Standalone (puerto 9105)
 */
if (!(window as any).singleSpaNavigate) {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}
