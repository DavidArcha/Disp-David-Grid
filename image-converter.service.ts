import { Injectable } from '@angular/core';
import heic2any from 'heic2any';
import * as UTIF from 'utif';


@Injectable({
  providedIn: 'root',
})
export class ImageConverterService {
  async convertToPng(file: File): Promise<string | null> {
    if (
      file.type.includes('heic') ||
      file.name.toLowerCase().endsWith('.heic')
    ) {
      // Handle .heic conversion
      try {
        const result = await heic2any({ blob: file, toType: 'image/png' });
        return URL.createObjectURL(result as Blob);
      } catch (error) {
        console.error('Error converting HEIC to PNG:', error);
        return null;
      }
    } else if (
      file.type === 'image/tiff' ||
      file.name.toLowerCase().endsWith('.tiff')
    ) {
      // Handle .tiff conversion
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const buffer = new Uint8Array(reader.result as ArrayBuffer);
            const ifds = UTIF.decode(buffer);

            if (ifds.length > 0) {
              UTIF.decodeImage(buffer, ifds[0]);
              const firstPage = ifds[0];
              const rgba = UTIF.toRGBA8(firstPage);

              const canvas = document.createElement('canvas');
              canvas.width = firstPage.width;
              canvas.height = firstPage.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const imageData = ctx.createImageData(
                  canvas.width,
                  canvas.height
                );
                imageData.data.set(rgba);
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
              } else {
                reject('Canvas context not available');
              }
            } else {
              reject('No images found in TIFF');
            }
          } catch (error) {
            console.error('Error converting TIFF to PNG:', error);
            reject(null);
          }
        };
        reader.onerror = () => {
          console.error('Error reading TIFF file');
          reject(null);
        };
        reader.readAsArrayBuffer(file);
      });
    } else if (
      ['image/jpeg', 'image/png', 'image/bmp', 'image/gif'].includes(file.type)
    ) {
      // Handle common image formats directly
      return URL.createObjectURL(file);
    } else {
      // Unsupported file type
      console.warn('Unsupported file type');
      return null;
    }
  }

}