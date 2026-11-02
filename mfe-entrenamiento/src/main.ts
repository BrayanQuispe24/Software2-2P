import { ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

let appRef: ApplicationRef | null = null;
let domElement: HTMLElement | null = null;

export async function bootstrap(props: any): Promise<void> {
  console.log('[single-spa:mfe-entrenamiento] Bootstrapping...', props);
}

export async function mount(props: any): Promise<void> {
  console.log('[single-spa:mfe-entrenamiento] Mounting...', props);

  const containerId = 'single-spa-application:@plataforma/instructores';
  domElement = (props && props.domElement) ? props.domElement : document.getElementById(containerId);

  if (!domElement) {
    domElement = document.createElement('div');
    domElement.id = containerId;
    const parent = document.getElementById('microfrontend-container') || document.body;
    parent.appendChild(domElement);
  }

  domElement.innerHTML = '<app-root></app-root>';

  try {
    appRef = await bootstrapApplication(App, appConfig);
  } catch (err) {
    console.error('[single-spa:mfe-entrenamiento] Error al montar:', err);
  }
}

export async function unmount(props: any): Promise<void> {
  console.log('[single-spa:mfe-entrenamiento] Unmounting...', props);

  if (appRef) {
    appRef.destroy();
    appRef = null;
  }

  if (domElement) {
    domElement.innerHTML = '';
  }
}

// Arranque directo en standalone / iframe
if (typeof window !== 'undefined' && !(window as any).singleSpaNavigate) {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}
