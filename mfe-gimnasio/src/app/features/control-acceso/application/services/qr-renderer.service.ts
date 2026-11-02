import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';

@Injectable({
  providedIn: 'root',
})
export class QrRendererService {
  /**
   * Genera una representación vectorial SVG nítida del código QR firmado.
   * Cero sobrecarga gráfica para el backend, renderizado 100% en el cliente.
   */
  async generarSvg(payload: string): Promise<string> {
    const qrcodeFn = (QRCode as any).toString || (QRCode as any).default?.toString || QRCode.toString;
    const svgRaw: string = await qrcodeFn(payload, {
      type: 'svg',
      margin: 2, // Margen blanco obligatorio (quiet zone) para detección óptica según estándar ISO/IEC 18004
      errorCorrectionLevel: 'L', // Nivel L: genera módulos más grandes y de menor densidad, ideales para cámaras web
      color: {
        dark: '#000000', // Módulos negros puros para máximo contraste
        light: '#ffffff', // Fondo blanco puro para reflectancia óptica óptima
      },
    });

    return svgRaw.includes('width=')
      ? svgRaw
      : svgRaw.replace('<svg ', '<svg width="100%" height="100%" ');
  }
}
