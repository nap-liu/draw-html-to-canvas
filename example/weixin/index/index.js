import renderHTML from './html';
import Render from '../lib/index.wx.min';

const app = getApp();

Page({
  data: {
    html: renderHTML,
    width: 0,
    height: 0,
  },
  onLoad() {
    console.error('该代码片段中内置的库不一定是最新的，所以请最好手动安装包到工程依赖！');
    console.error('该代码片段中内置的库不一定是最新的，所以请最好手动安装包到工程依赖！');
    console.error('该代码片段中内置的库不一定是最新的，所以请最好手动安装包到工程依赖！');
    wx.createSelectorQuery().select('#canvas').node(({node}) => {
      this.canvas = node;
      this.onDraw();
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
    if (this.canvas) {
      const html = this.data.html;
      const ctx = this.canvas.getContext('2d');

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
      await render.loadSource(ctx);
      // 计算布局
      render.layout(ctx);

      // 修改canvas绘图尺寸和网页一致
      const {offsetWidth, offsetHeight} = render.rootNode;
      this.canvas.width = offsetWidth * info.pixelRatio;
      this.canvas.height = offsetHeight * info.pixelRatio;
      ctx.scale(info.pixelRatio, info.pixelRatio);

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
      });

    } else {
      console.error('当前基础库版本不支持canvas 2d, 选择2.9.0以上版本的基础库再试');
    }
  },
});
