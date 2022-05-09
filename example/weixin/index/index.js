import renderHTML from './html';
import Render, {ElementImage} from '../lib/index.esm.min';
import {loadGreaterThan2_9_0, loadGreaterThan1_9_0} from '../lib/wx.adapter.min';

const app = getApp();

Page({
  data: {
    html: renderHTML,
    width: 0,
    height: 0,
    use2D: true,
    // use2D: false,
  },
  onLoad() {
    console.error('该代码片段中内置的库不一定是最新的，所以请最好手动安装包到工程依赖！');
    console.error('该代码片段中内置的库不一定是最新的，所以请最好手动安装包到工程依赖！');
    console.error('该代码片段中内置的库不一定是最新的，所以请最好手动安装包到工程依赖！');

    wx.createSelectorQuery().select('#canvas').node(({node}) => {
      let use2D = false;
      if (node) {
        // 基础库 >= 2.9.0 同层渲染api
        // 兼容wx的图片加载机制
        ElementImage.prototype.load = loadGreaterThan2_9_0;
        this.canvas = node;
        use2D = true;
      } else {
        // 1.9 >= 基础库版本 < 2.7.7 部分边框会有问题
        // 2.7.7 >= 基础库版本 < 2.9.0 和同层渲染效果相同
        // 兼容wx的图片加载机制
        ElementImage.prototype.load = loadGreaterThan1_9_0;
        this.ctx = wx.createCanvasContext('canvas', this);
        use2D = false;
      }
      this.setData({ use2D }, this.onDraw);
    }).exec();
  },

  onInput(event) {
    const value = event.detail.value;
    this.setData({html: value});
  },

  onReset() {
    this.setData({
      html: renderHTML,
    }, () => {
      this.onDraw();
    });
  },

  async onDraw() {
    const html = this.data.html;
    const ctx = this.data.use2D ? this.canvas.getContext('2d') : this.ctx;

    const info = wx.getSystemInfoSync();

    // 保存当前canvas的缩放状态
    ctx.save();
    // 清空canvas图像数据
    ctx.clearRect(0, 0, 10000, 10000);

    // 实例化渲染组件
    const render = Render.fromHTML(html);
    // 设置网页最大宽度
    render.rootNode.style.set('width', `${info.windowWidth}px`);
    // 加载网页图片
    await render.loadSource(this.canvas);
    // 计算布局
    render.layout(ctx);
    // 修改canvas绘图尺寸和网页一致
    const {offsetWidth, offsetHeight} = render.rootNode;
    if (this.data.use2D) {
      this.canvas.width = offsetWidth * info.pixelRatio;
      this.canvas.height = offsetHeight * info.pixelRatio;
      ctx.scale(info.pixelRatio, info.pixelRatio);
    }

    console.log(offsetWidth, offsetHeight);

    // 设置canvas dom节点缩放尺寸一致
    this.setData({
      width: offsetWidth,
      height: offsetHeight,
    }, () => {
      // 绘制html到canvas
      render.draw(ctx);

      // 恢复canvas缩放状态到正常
      ctx.restore();

      // 老版本canvas 需要使用draw()方法 把动作全都同步到native
      if (!this.data.use2D) {
        ctx.draw();
      }
    });
  },
});
