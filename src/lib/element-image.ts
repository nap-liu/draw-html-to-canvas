import Element from './element';

export default class ElementImage extends Element {
  public src: string = '';
  public source?: HTMLImageElement;
  public imageWidth = 0;
  public imageHeight = 0;

  public load(): Promise<this> {
    const src = this.attrs.src;
    return new Promise((resolve, reject) => {
      if (src) {
        const img = new Image();
        img.onerror = (e) => {
          reject(e)
        };
        img.onload = () => {
          this.imageWidth = img.naturalWidth;
          this.imageHeight = img.naturalHeight;
          this.source = img;
          this.src = src;
          resolve(this);
        };
        img.src = src;
      } else {
        resolve(this);
      }
    })
  }
}