import renderHTML from './html';
import Render, {ElementImage} from '../lib/index.esm.min';
import {loadGreaterThan_2_9_0, loadGreaterThan_1_9_0} from '../lib/wx.adapter.min';

const app = getApp();

Page({
  data: {
    html: renderHTML,
    width: 0,
    height: 0,
    use2D: true,
  },
  onReady() {
    console.error('该代码片段中内置的库不一定是最新的，所以请最好手动安装包到工程依赖！');
    console.error('该代码片段中内置的库不一定是最新的，所以请最好手动安装包到工程依赖！');
    console.error('该代码片段中内置的库不一定是最新的，所以请最好手动安装包到工程依赖！');

    console.log('查询canvas dom节点');
    wx.createSelectorQuery().select('#canvas').fields({node: true, context: true}, (node) => {
      console.log('查询dom结果', node);
      if (node && node.node) {
        console.log('可以使用同层渲染api', node.node);
        // 基础库 >= 2.9.0 同层渲染api 使用新版api加载图片
        ElementImage.prototype.load = loadGreaterThan_2_9_0;
        this.canvas = node.node;
        this.onDraw();
      } else if (node && node.context) {
        console.log('使用native渲染api', node.context);
        // 1.9 >= 基础库版本 < 2.9.0 使用旧版api加载图片
        ElementImage.prototype.load = loadGreaterThan_1_9_0;
        this.context = node.context;
        this.onDraw();
      } else {
        console.log('不支持同层渲染，降级为native');
        this.setData({use2D: false}, () => {
          this.onReady();
        });
      }
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
    const {html, use2D} = this.data;
    const {canvas, context} = this;
    const ctx = use2D ? canvas.getContext('2d') : context;

    console.log('初始化环境', use2D ? '使用同层渲染' : '使用native渲染');
    const info = wx.getSystemInfoSync();

    // 保存当前canvas的缩放状态
    ctx.save();
    // 清空canvas图像数据
    ctx.clearRect(0, 0, 10000, 10000);

    console.log('加载html');
    // 实例化渲染组件
    const render = Render.fromHTML(html);
    // 设置网页最大宽度
    render.rootNode.style.set('width', `${info.windowWidth}px`);
    console.log('开始加载图片资源');
    // 加载网页图片
    await render.loadSource(use2D ? canvas : wx);
    console.log('图片资源加载完成');
    // 计算布局
    render.layout(ctx);
    console.log('布局计算完成');
    // 修改canvas绘图尺寸和网页一致
    const {offsetWidth, offsetHeight} = render.rootNode;
    if (use2D) {
      this.canvas.width = offsetWidth * info.pixelRatio;
      this.canvas.height = offsetHeight * info.pixelRatio;
      ctx.scale(info.pixelRatio, info.pixelRatio);
    }

    console.log('网页尺寸为：', render, offsetWidth, offsetHeight);

    // 设置canvas dom节点缩放尺寸一致
    this.setData({
      width: offsetWidth,
      height: offsetHeight,
    }, () => {
      console.log('开始绘制网页');
      // 绘制html到canvas
      render.draw(ctx);

      console.log('网页绘制完成');

      // 恢复canvas缩放状态到正常
      ctx.restore();

      // 老版本canvas 需要使用draw()方法 把动作全都同步到native
      if (!use2D) {
        ctx.draw(true, () => {
          console.log('native 绘制完成');
        });
      }
    });
  },
});
