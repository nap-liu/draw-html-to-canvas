import Render from '../index';
import ElementImage from '../element-image';

// @ts-ignore
ElementImage.prototype.load = function(canvas: HTMLCanvasElement): Promise<this> {
  const src = this.attrs.src;
  return new Promise((resolve, reject) => {
    if (src) {
      // 微信小程序专属的api
      // @ts-ignore
      const img = canvas.createImage();
      img.onerror = (e: Error) => {
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
export default Render;