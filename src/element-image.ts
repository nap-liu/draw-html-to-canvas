import Element from './element';

export default class ElementImage extends Element {
  public src: string = '';
  public source?: HTMLImageElement;
  public imageWidth = 0;
  public imageHeight = 0;

  /**
   * 微信小程序需要传递canvas实例
   * @param canvas
   */
  public load(canvas?: HTMLCanvasElement): Promise<this>;
  public load(): Promise<this> {
    const src = this.attrs.src;
    return new Promise((resolve, reject) => {
      if (src) {
        const img = new Image();
        img.onerror = (e) => {
          if (this.root.debug) {
            console.log('image loaded error', img, e);
          }
          reject(e)
        };
        img.onload = () => {
          if (this.root.debug) {
            console.log('image loaded success', img);
          }
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