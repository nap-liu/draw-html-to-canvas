/**
 * 随机颜色
 * @param start
 * @param end
 */
import {BackgroundRepeat} from './constants';

export const randomColor = (start = 0, end = 255) => {
  return `rgb(${start + parseInt(Math.random() * end as any as string)},${start + parseInt(Math.random() * end as any as string)},${start + parseInt(Math.random() * end as any as string)})`;
};

/**
 * 画重复图片 带着偏移量 自动填充整个容器
 * @param ctx
 * @param image
 * @param imageWidth 图像宽度
 * @param imageHeight 图像高度
 * @param originLeft 裁剪起点
 * @param originTop 裁剪起点
 * @param startLeft 绘制起点
 * @param startTop 绘制起点
 * @param width 容器尺寸
 * @param height 容器尺寸
 * @param repeat
 */
export const drawRepeatImage = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  imageWidth: number, imageHeight: number,
  originLeft: number, originTop: number,
  startLeft: number, startTop: number,
  width: number, height: number,
  repeat: BackgroundRepeat,
) => {
  ctx.save();

  ctx.beginPath();
  ctx.rect(originLeft, originTop, width, height);
  ctx.clip();

  const offsetTopLength = startTop - originTop;
  const offsetTopCount = Math.ceil(offsetTopLength / imageHeight);
  const offsetTop = -offsetTopCount * imageHeight + offsetTopLength;

  const offsetLeftLength = startLeft - originLeft;
  const offsetLeftCount = Math.ceil(offsetLeftLength / imageWidth);
  const offsetLeft = -offsetLeftCount * imageWidth + offsetLeftLength;

  const rows = Math.ceil(height / imageHeight) + 1;
  const cols = Math.ceil(width / imageWidth) + 1;

  if (repeat === BackgroundRepeat.repeat) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * imageWidth;
        const y = r * imageHeight;
        ctx.drawImage(image, offsetLeft + x, offsetTop + y, imageWidth, imageHeight);
      }
    }
  } else if (repeat === BackgroundRepeat.repeatY) {
    for (let r = 0; r < rows; r++) {
      const y = r * imageHeight;
      ctx.drawImage(image, startLeft, y + offsetTop, imageWidth, imageHeight);
    }
  } else if (repeat === BackgroundRepeat.repeatX) {
    for (let c = 0; c < cols; c++) {
      const x = c * imageWidth;
      ctx.drawImage(image, x + offsetLeft, startTop, imageWidth, imageHeight);
    }
  } else if (repeat === BackgroundRepeat.noRepeat) {
    ctx.drawImage(image, startLeft, startTop, imageWidth, imageHeight);
  }
  ctx.restore();
};