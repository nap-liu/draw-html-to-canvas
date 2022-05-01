/**
 * 随机颜色
 * @param start
 * @param end
 */
import {BackgroundRepeat, TContinueDraw, TCurvePath} from './constants';

export const randomColor = (start = 0, end = 255) => {
  return `rgb(${start + parseInt(Math.random() * end as any as string)},${start + parseInt(Math.random() * end as any as string)},${start + parseInt(Math.random() * end as any as string)})`;
};

/**
 * 画重复图片 带着偏移量 自动填充整个容器
 * @param ctx
 * @param image
 * @param imageWidth 图像宽度
 * @param imageHeight 图像高度
 * @param startLeft 绘制起点
 * @param startTop 绘制起点
 * @param boxLeft 容器起点
 * @param boxTop 容器起点
 * @param boxWidth 容器尺寸
 * @param boxHeight 容器尺寸
 * @param repeat 重复类型
 * @param continueDraw 选区内继续绘图
 */
export const drawRepeatImage = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  imageWidth: number, imageHeight: number,
  startLeft: number, startTop: number,
  boxLeft: number, boxTop: number,
  boxWidth: number, boxHeight: number,
  repeat: BackgroundRepeat,
  continueDraw?: TContinueDraw,
) => {
  ctx.save();

  ctx.translate(boxLeft, boxTop);

  ctx.beginPath();
  ctx.rect(0, 0, boxWidth, boxHeight);
  ctx.clip();

  const offsetLeftCount = Math.ceil(startLeft / imageWidth);
  const offsetLeft = -offsetLeftCount * imageWidth + startLeft;

  const offsetTopCount = Math.ceil(startTop / imageHeight);
  const offsetTop = -offsetTopCount * imageHeight + startTop;

  const rows = Math.ceil(boxHeight / imageHeight) + 1;
  const cols = Math.ceil(boxWidth / imageWidth) + 1;

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

  if (typeof continueDraw === 'function') {
    continueDraw(ctx);
  }

  ctx.restore();
};

/**
 * 截取 起点 - t 点
 * @param P0 起点
 * @param P1 控制点
 * @param P2 结束点
 * @param t 截取百分比
 * @returns {[number,number,number]} P0, M, B
 */
export const cutCurveStart = (P0: number, P1: number, P2: number, t: number) => {
  const M = (1 - t) * P0 + P1 * t;
  const N = (1 - t) * P1 + P2 * t;
  const B = (1 - t) * M + N * t; // 终点
  return [P0, M, B];
};

/**
 * 截取贝塞尔曲线 从 【起点 - t时刻】 路径
 * 返回新的曲线的 [起点, 控制点， 终点] 的坐标
 * @param path [起点, 控制点， 终点] 坐标
 * @param t 时刻百分比
 */
export const cutCurveStartPath = (path: number[][], t: number): TCurvePath => {
  const x = cutCurveStart(path[0][0], path[1][0], path[2][0], t);
  const y = cutCurveStart(path[0][1], path[1][1], path[2][1], t);
  return [
    [x[0], y[0]],
    [x[1], y[1]],
    [x[2], y[2]],
  ];
}

/**
 * 截取从 t - P2 点
 * @param P0
 * @param P1
 * @param P2
 * @param t
 * @returns {[number,number,number]} B, N, P2
 */
export const cutCurveEnd = (P0: number, P1: number, P2: number, t: number) => {
  const M = (1 - t) * P0 + P1 * t;
  const N = (1 - t) * P1 + P2 * t;
  const B = (1 - t) * M + N * t; // 起点
  return [B, N, P2];
};

/**
 * 截取贝塞尔曲线【t时刻 到 终点】的路径
 * 返回新的曲线的 [起点, 控制点， 终点] 的坐标
 * @param path [起点, 控制点， 终点] 坐标
 * @param t 时刻百分比
 */
export const cutCurveEndPath = (path: number[][], t: number): TCurvePath => {
  const x = cutCurveEnd(path[0][0], path[1][0], path[2][0], t);
  const y = cutCurveEnd(path[0][1], path[1][1], path[2][1], t);
  return [
    [x[0], y[0]],
    [x[1], y[1]],
    [x[2], y[2]],
  ];
}

/**
 * 截取 t1 - t2
 * @param P0
 * @param P1
 * @param P2
 * @param t1 起始百分比
 * @param t2 结束百分比
 */
export const cutCurveMiddle = (P0: number, P1: number, P2: number, t1: number, t2: number) => {
  const [s0, s1, s2] = cutCurveStart(P0, P1, P2, t2);
  return cutCurveEnd(s0, s1, s2, t1 / t2);
};

/**
 * 截取贝塞尔曲线 【t1时刻 到 t2时刻】 路径
 * 返回新的曲线的 [起点, 控制点， 终点] 的坐标
 * @param path [起点, 控制点， 终点] 坐标
 * @param t1 时刻百分比
 * @param t2 时刻百分比
 */
export const cutCurveMiddlePath = (path: number[][], t1: number, t2: number): TCurvePath => {
  const x = cutCurveMiddle(path[0][0], path[1][0], path[2][0], t1, t2);
  const y = cutCurveMiddle(path[0][1], path[1][1], path[2][1], t1, t2);
  return [
    [x[0], y[0]],
    [x[1], y[1]],
    [x[2], y[2]],
  ];
}

export const ellipse = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  xDis: number, yDis: number,
  rotation: number,
  startAngle: number, endAngle: number
) => {
  var kappa = 0.5522848, // 4 * ((√(2) - 1) / 3)
    ox = xDis * kappa,  // control point offset horizontal
    oy = yDis * kappa,  // control point offset vertical
    xe = x + xDis,      // x-end
    ye = y + yDis;      // y-end

  // ctx.strokeRect(x, y, xDis, yDis);

  ctx.moveTo(x - xDis, y);
  ctx.bezierCurveTo(x - xDis, y - oy, x - ox, y - yDis, x, y - yDis);
  ctx.bezierCurveTo(x + ox, y - yDis, xe, y - oy, xe, y);
  // ctx.moveTo(xe, y);
  ctx.bezierCurveTo(xe, y + oy, x + ox, ye, x, ye);
  // ctx.strokeRect(xe, y, 10, 10);
  // ctx.strokeRect(xe, y + oy, 10, 10);
  // ctx.strokeRect(x + ox, ye, 10, 10);
  // ctx.strokeRect(x, ye, 10, 10);
  ctx.bezierCurveTo(x - ox, ye, x - xDis, y + oy, x - xDis, y);
  // ctx.closePath();
}

export const values = (obj: any) => {
  return Object.values ? Object.values(obj) : Object.keys(obj).map(i => obj[i]);
}