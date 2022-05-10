import ElementImage from '../element-image';

/**
 * 同层渲染api兼容方法
 * @param canvas
 */
export function loadGreaterThan_2_9_0(this: ElementImage, canvas: HTMLCanvasElement): Promise<ElementImage> {
  const src = this.attrs.src;
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
        this.imageWidth = img.width;
        this.imageHeight = img.height;
        this.source = img;
        this.src = src;
        resolve(this);
        if (this.root.debug) {
          console.log('image loaded', src, img.width, img.height);
        }
      };
      img.src = src;
    } else {
      resolve(this);
    }
  })
}

interface IImageInfo {
  width: number; //	图片原始宽度，单位px。不考虑旋转。
  height: number; //	图片原始高度，单位px。不考虑旋转。
  path: string; //	图片的本地路径
}

/**
 * native渲染api兼容方法
 * @param wx 全局方法对象
 */
export function loadGreaterThan_1_9_0(this: ElementImage, wx: any): Promise<ElementImage> {
  const src = this.attrs.src;
  return new Promise((resolve, reject) => {
    if (src) {
      // 微信小程序专属的api
      // @ts-ignore
      wx.getImageInfo({
        src,
        success: (info: IImageInfo) => {
          this.imageWidth = info.width;
          this.imageHeight = info.height;
          // @ts-ignore
          this.source = /^http/.test(src) ? info.path : src;
          this.src = src;
          resolve(this);
          if (this.root.debug) {
            console.log('image loaded', src, info.width, info.height);
          }
        },
        fail: (e: any) => {
          reject(e);
          if (this.root.debug) {
            console.log('image loaded error', src, e);
          }
        },
      })
    } else {
      resolve(this);
    }
  })
}
