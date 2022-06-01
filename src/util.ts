/**
 * 随机颜色
 * @param start
 * @param end
 */
import {
  BackgroundRepeat,
  REG_PCT,
  REG_PX, styleKeywords,
  TBezierCurvePath,
  TContinueDraw,
  TQuadraticCurvePath,
} from './constants';
import {IGradient} from './style';

export const randomColor = (start = 0, end = 255, a = 1) => {
  return `rgba(${start + parseInt(Math.random() * end as any as string)},${start + parseInt(Math.random() * end as any as string)},${start + parseInt(Math.random() * end as any as string)}, ${a})`;
};

export enum DrawRepeatType {
  image = 'image',
  gradient = 'gradient'
}

/**
 * 画重复图像 带着偏移量 自动填充整个容器
 * @param ctx
 * @param drawType DrawRepeatType
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
export const drawRepeat = (
  ctx: CanvasRenderingContext2D,
  drawType: DrawRepeatType,
  image: HTMLImageElement | CanvasGradient,
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

  let isGradient = false;
  if (drawType === DrawRepeatType.gradient) {
    ctx.fillStyle = image as CanvasGradient;
    isGradient = true;
  }

  if (repeat === BackgroundRepeat.repeat) {
    if (isGradient) {
      ctx.translate(offsetLeft, offsetTop);
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * imageWidth;
        const y = r * imageHeight;
        if (drawType === DrawRepeatType.image) {
          ctx.drawImage(image as HTMLImageElement, offsetLeft + x, offsetTop + y, imageWidth, imageHeight);
        } else if (drawType === DrawRepeatType.gradient) {
          ctx.fillRect(0, 0, imageWidth, imageHeight);
          ctx.translate(imageWidth, 0)
        }
      }
      if (isGradient) {
        ctx.translate(-cols * imageWidth, imageHeight)
      }
    }
  } else if (repeat === BackgroundRepeat.repeatY) {
    if (isGradient) {
      ctx.translate(startLeft, offsetTop);
    }
    for (let r = 0; r < rows; r++) {
      const y = r * imageHeight;
      if (drawType === DrawRepeatType.image) {
        ctx.drawImage(image as HTMLImageElement, startLeft, y + offsetTop, imageWidth, imageHeight);
      } else if (drawType === DrawRepeatType.gradient) {
        ctx.fillRect(0, 0, imageWidth, imageHeight);
        ctx.translate(0, imageHeight);
      }
    }
  } else if (repeat === BackgroundRepeat.repeatX) {
    if (isGradient) {
      ctx.translate(offsetLeft, startTop);
    }
    for (let c = 0; c < cols; c++) {
      const x = c * imageWidth;
      if (drawType === DrawRepeatType.image) {
        ctx.drawImage(image as HTMLImageElement, x + offsetLeft, startTop, imageWidth, imageHeight);
      } else if (drawType === DrawRepeatType.gradient) {
        ctx.fillRect(0, 0, imageWidth, imageHeight);
        ctx.translate(imageWidth, 0)
      }
    }
  } else if (repeat === BackgroundRepeat.noRepeat) {
    if (drawType === DrawRepeatType.image) {
      ctx.drawImage(image as HTMLImageElement, startLeft, startTop, imageWidth, imageHeight);
    } else if (drawType === DrawRepeatType.gradient) {
      ctx.translate(startLeft, startTop)
      ctx.fillRect(0, 0, imageWidth, imageHeight);
    }
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
export const cutCurveStartPath = (path: number[][], t: number): TQuadraticCurvePath => {
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
export const cutCurveEndPath = (path: number[][], t: number): TQuadraticCurvePath => {
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
export const cutCurveMiddlePath = (path: number[][], t1: number, t2: number): TQuadraticCurvePath => {
  const x = cutCurveMiddle(path[0][0], path[1][0], path[2][0], t1, t2);
  const y = cutCurveMiddle(path[0][1], path[1][1], path[2][1], t1, t2);
  return [
    [x[0], y[0]],
    [x[1], y[1]],
    [x[2], y[2]],
  ];
}

export const values = (obj: any) => {
  return Object.values ? Object.values(obj) : Object.keys(obj).map(i => obj[i]);
}

/**
 * 创建线性渐变
 * @param ctx
 * @param width
 * @param height
 * @param gradient
 */
export const createLinearGradient = (
  ctx: CanvasRenderingContext2D,
  width: number, height: number,
  gradient: IGradient,
): CanvasGradient => {
  // TODO transparent 会导致透明渐变成灰阶
  const angle = (Math.PI / 180) * (90 - gradient.angle);

  const length = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle))
  const halfLength = length / 2;

  const centerX = (width) / 2;
  const centerY = (height) / 2;
  const offsetX = Math.cos(angle) * halfLength;
  const offsetY = Math.sin(angle) * halfLength;

  const g = ctx.createLinearGradient(
    centerX - offsetX, centerY + offsetY,
    centerX + offsetX, centerY - offsetY,
  );

  gradient.list.forEach((item, index) => {
    let stop: string | number = item.stop;
    if (REG_PX.test(stop)) {
      stop = parseFloat(stop) / length;
      stop = stop > 1 ? 1 : stop;
    } else if (REG_PCT.test(stop)) {
      stop = parseFloat(stop) / 100;
    } else if (index === 0) {
      stop = 0;
    } else if (index === gradient.list.length - 1) {
      stop = 1;
    }
    g.addColorStop(stop as any, item.color);
  })
  return g;
};

/**
 * 三次贝塞尔 截取 P0 - t
 * @param P0
 * @param P1
 * @param P2
 * @param P3
 * @param t
 */
const cutBezierStart = (P0: number, P1: number, P2: number, P3: number, t: number) => {
  const Q0 = (1 - t) * P0 + P1 * t; // 一次
  const Q1 = (1 - t) * P1 + P2 * t;
  const Q2 = (1 - t) * P2 + P3 * t;

  const R0 = (1 - t) * Q0 + Q1 * t; // 二次
  const R1 = (1 - t) * Q1 + Q2 * t;

  const B = (1 - t) * R0 + R1 * t; // 三次

  return [P0, Q0, R0, B];
};
/**
 * 三次贝塞尔 截取 t - P3
 * @param P0
 * @param P1
 * @param P2
 * @param P3
 * @param t
 */
const cutBezierEnd = (P0: number, P1: number, P2: number, P3: number, t: number) => {
  const Q0 = (1 - t) * P0 + P1 * t; // 一次
  const Q1 = (1 - t) * P1 + P2 * t;
  const Q2 = (1 - t) * P2 + P3 * t;

  const R0 = (1 - t) * Q0 + Q1 * t; // 二次
  const R1 = (1 - t) * Q1 + Q2 * t;

  const B = (1 - t) * R0 + R1 * t; // 三次

  return [B, R1, Q2, P3];
};
/**
 * 三次贝塞尔 截取 t1 - t2
 * @param P0
 * @param P1
 * @param P2
 * @param P3
 * @param t1
 * @param t2
 */
const cutBezierMiddle = (P0: number, P1: number, P2: number, P3: number, t1: number, t2: number) => {
  const [s0, s1, s2, s3] = cutBezierStart(P0, P1, P2, P3, t2);
  return cutBezierEnd(s0, s1, s2, s3, t1 / t2);
};

/**
 * 三次贝塞尔路径 截取 P0 - t
 * @param path
 * @param t
 */
const cutBezierStartPath = (path: TBezierCurvePath, t: number): TBezierCurvePath => {
  const [p1, p2, p3, p4] = path;
  const x = cutBezierStart(p1[0], p2[0], p3[0], p4[0], t);
  const y = cutBezierStart(p1[1], p2[1], p3[1], p4[1], t);
  return [
    [x[0], y[0]],
    [x[1], y[1]],
    [x[2], y[2]],
    [x[3], y[3]],
  ];
};

/**
 * 三次贝塞尔路径 截取 t - P3
 * @param path
 * @param t
 */
const cutBezierEndPath = (path: TBezierCurvePath, t: number): TBezierCurvePath => {
  const [p1, p2, p3, p4] = path;
  const x = cutBezierEnd(p1[0], p2[0], p3[0], p4[0], t);
  const y = cutBezierEnd(p1[1], p2[1], p3[1], p4[1], t);
  return [
    [x[0], y[0]],
    [x[1], y[1]],
    [x[2], y[2]],
    [x[3], y[3]],
  ];
};

/**
 * 三次贝塞尔路径 截取 t1 - t2
 * @param path
 * @param t1
 * @param t2
 */
const cutBezierMiddlePath = (path: TBezierCurvePath, t1: number, t2: number): TBezierCurvePath => {
  const [p1, p2, p3, p4] = path;
  const x = cutBezierMiddle(p1[0], p2[0], p3[0], p4[0], t1, t2);
  const y = cutBezierMiddle(p1[1], p2[1], p3[1], p4[1], t1, t2);
  return [
    [x[0], y[0]],
    [x[1], y[1]],
    [x[2], y[2]],
    [x[3], y[3]],
  ];
};

/**
 * 三次贝塞尔模拟椭圆 环境支持优先使用环境的
 * 效率比画圆形缩放要低一些 但是在小程序中没有问题
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} radiusX
 * @param {number} radiusY
 * @param {number} rotation
 * @param {number} startAngle
 * @param {number} endAngle
 * @param {boolean?} counterclockwise
 */
export const ellipse = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  radiusX: number, radiusY: number,
  rotation: number,
  startAngle: number, endAngle: number,
  counterclockwise?: boolean,
) => {
  if (ctx.ellipse) {
    return ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
  }

  const oneDegree = Math.PI / 180;

  let start = startAngle / oneDegree;
  let end = endAngle / oneDegree;

  if (radiusX === 0 || radiusY === 0 || start === end) {
    return;
  }

  const kappa = 0.5522848, // 4 * ((√(2) - 1) / 3)
    ox = radiusX * kappa,  // control point offset horizontal
    oy = radiusY * kappa,  // control point offset vertical
    xe = x + radiusX,      // x-end
    ye = y + radiusY;      // y-end

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.translate(-x, -y);

  if (start < 0) {
    const startAbs = Math.abs(start);
    const startRestAngle = startAbs % 360;
    const startCount = Math.ceil(startAbs / 360);
    start = startCount * 360 - startRestAngle;
    if (end < 0) {
      const endAbs = Math.abs(end);
      const endRestAngle = endAbs % 360;
      const endCount = Math.ceil(endAbs / 360);
      end = endCount * 360 - endRestAngle;
      if (end < start) {
        end += startCount * 360;
      }
    } else {
      end += startCount * 360;
    }
  } else if (end < 0) {
    const endAbs = Math.abs(end);
    const endRestAngle = endAbs % 360;
    const endCount = Math.ceil(endAbs / 360);
    end = endCount * 360 - endRestAngle;
    start += (endCount - 1) * 360;
  }

  // 三点钟方向开始顺时针
  const direction: TBezierCurvePath[] = [
    [
      [xe, y],
      [xe, y + oy],
      [x + ox, ye],
      [x, ye],
    ],
    [
      [x, ye],
      [x - ox, ye],
      [x - radiusX, y + oy],
      [x - radiusX, y],
    ],
    [
      [x - radiusX, y],
      [x - radiusX, y - oy],
      [x - ox, y - radiusY],
      [x, y - radiusY],
    ],
    [
      [x, y - radiusY],
      [x + ox, y - radiusY],
      [xe, y - oy],
      [xe, y],
    ],
  ];

  let offset = 0;
  const drawPaths: TBezierCurvePath[] = [];

  while (start + offset < end) {
    const current = start + offset;
    const count = Math.floor(current / 90);
    const dir = count % 4;
    drawPaths.push(direction[dir]);
    if (offset === 0 && start % 90 !== 0) {
      offset += 90 - start % 90;
    } else {
      offset += 90;
    }
  }

  if (drawPaths.length) {
    if (drawPaths.length === 1 && start % 90 !== 0 && end % 90 !== 0) {
      drawPaths[0] = cutBezierMiddlePath(drawPaths[0], (start % 90) / 90, (end % 90) / 90);
    } else {
      if (start % 90 !== 0) {
        drawPaths[0] = cutBezierEndPath(drawPaths[0], (start % 90) / 90);
      }
      if (end % 90 !== 0) {
        drawPaths[drawPaths.length - 1] = cutBezierStartPath(drawPaths[drawPaths.length - 1], (end % 90) / 90);
      }
    }

    drawPaths.forEach(([p1, p2, p3, p4], index) => {
      if (index === 0) {
        ctx.lineTo(...p1);
      }
      ctx.bezierCurveTo(...p2, ...p3, ...p4);
    });
  }
  ctx.restore();
};

/**
 * 圆形缩放成椭圆 环境支持优先使用环境的
 * 小程序环境绘制异常
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} radiusX
 * @param {number} radiusY
 * @param {number} rotation
 * @param {number} startAngle
 * @param {number} endAngle
 * @param {boolean?} counterclockwise
 */
export const ellipse2 = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  radiusX: number, radiusY: number,
  rotation: number,
  startAngle: number, endAngle: number,
  counterclockwise?: boolean,
) => {
  if (ctx.ellipse) {
    return ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
  }
  if (radiusX === 0 || radiusY === 0) return;
  const xRatio = radiusX / radiusY;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(xRatio, 1.0);
  ctx.translate(-x, -y);
  ctx.arc(x, y, radiusY, startAngle, endAngle, counterclockwise);
  ctx.restore();
}

export const makeMap = <T = any>(obj: any): {
  [K in keyof T]: K;
} => {
  Object.keys(obj).forEach(originKey => {
    let key = originKey;
    if (/-/.test(key)) {
      key = key.split('-').map((i, idx) => {
        if (idx > 0) {
          return i[0].toUpperCase() + i.slice(1);
        }
        return i;
      }).join('');
      delete obj[originKey];
    }
    // @ts-ignore
    obj[key] = originKey;
  });
  return obj;
};

export const applyMixins = (derivedCtor: any, baseCtors: any[]) => {
  baseCtors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      derivedCtor.prototype[name] = baseCtor.prototype[name];
    });
  });
}