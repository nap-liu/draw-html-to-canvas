const fs = require('fs');
const path = require('path');
const {createCanvas, Image} = require('canvas');
const canvas = createCanvas(200, 200);
const ctx = canvas.getContext('2d');
const html = require('../browser/html');
const {default: Render, ElementImage} = require('draw-html-to-canvas/dist/index.cjs');
// console.log(html);

/**
 * 适配 image 加载逻辑
 * @returns {Promise<unknown>}
 */
ElementImage.prototype.load = function() {
  const src = this.attrs.src;
  return new Promise((resolve, reject) => {
    if (src) {
      // 重定向图片地址到本地路径
      const staticPath = path.join(__dirname, '..', 'resources', src);
      const img = new Image();
      img.onerror = (e) => {
        if (this.root.debug) {
          console.log('image loaded error', img, e);
        }
        reject(e);
      };
      img.onload = () => {
        if (this.root.debug) {
          console.log('image loaded success', img);
        }
        this.imageWidth = img.naturalWidth;
        this.imageHeight = img.naturalHeight;
        this.source = img;
        this.src = staticPath;
        resolve(this);
      };
      img.src = staticPath;
    } else {
      resolve(this);
    }
  });
};

;(async () => {

  const scale = 2;
  const render = Render.fromHTML(html);

  render.rootNode.style.set('width', '750px');
  render.rootNode.style.set('background-color', '#fff');
  render.layout(ctx);
  const {offsetWidth, offsetHeight} = render.rootNode;
  canvas.width = offsetWidth * scale;
  canvas.height = offsetHeight * scale;
  ctx.scale(scale, scale);


  await render.loadSource();

  render.draw(ctx);

  fs.writeFileSync('./demo.png', canvas.toBuffer());

})();