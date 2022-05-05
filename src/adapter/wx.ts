import Render from '../index';
import ElementImage from '../element-image';

// @ts-ignore
ElementImage.prototype.load = function(canvas: HTMLCanvasElement): Promise<this> {
  const src = this.attrs.src;
  const element = this;
  return new Promise((resolve, reject) => {
    if (src) {
      // 微信小程序专属的api
      // @ts-ignore
      const img = canvas.createImage();
      img.onerror = (e: Error) => {
        reject(e)
        if (this.root.debug) {
          console.log('image loaded error', src, e);
        }
      };
      img.onload = () => {
        element.imageWidth = img.width;
        element.imageHeight = img.height;
        element.source = img;
        element.src = src;
        resolve(element);
        if (this.root.debug) {
          console.log('image loaded', src, img.width, img.height);
        }
      };
      img.src = src;
    } else {
      resolve(element);
    }
  })
}
export {ElementImage};
export default Render;