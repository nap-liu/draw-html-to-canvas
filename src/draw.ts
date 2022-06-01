import Element from './element';
import {IBackground, IBorder} from './style';
import {BackgroundClip, BackgroundPosition, BackgroundSize, BlockType, BORDER_STYLE, GradientType, NodeType, REG_PCT, REG_PX, SupportElement, TContinueDraw, TEXT_DECORATION_LINE, TEXT_DECORATION_STYLE} from './constants';
import {createLinearGradient, drawRepeat, DrawRepeatType, ellipse} from './util';
import ElementImage from './element-image';

class Draw {
  /**
   * 绘制元素背景图 不包含margin区域
   * @param context
   * @param background
   * @param clip 裁剪内圆选区
   */
  public drawBackground(this: Draw & Element, context: CanvasRenderingContext2D, background: IBackground<string>, clip: any) {
    context.save();
    const {border, padding, fontSize, lineHeight, isBorderBox} = this.style;
    const {contentWidth, contentHeight} = this;
    const lineHeightOffset = (lineHeight - fontSize) / 2;

    const isInline = this.blockType === BlockType.inline;

    const getClipBox = (clip: BackgroundClip) => {
      let x = 0;
      let y = 0;
      let width = 0;
      let height = 0;
      if (clip === BackgroundClip.borderBox) {
        x = 0;
        y = 0;
        width = contentWidth + (isBorderBox ? 0 : padding.left + padding.right + border.left.width + border.right.width);
        height = contentHeight + (isBorderBox ? 0 : padding.top + padding.bottom + border.top.width + border.bottom.width);
      } else if (clip === BackgroundClip.paddingBox) {
        x = border.left.width;
        y = border.top.width;
        width = contentWidth + (isBorderBox ? 0 : padding.left + padding.right);
        height = contentHeight + (isBorderBox ? 0 : padding.top + padding.bottom);
      } else if (clip === BackgroundClip.contentBox) {
        x = border.left.width + (isBorderBox ? 0 : padding.left);
        y = border.top.width + (isBorderBox ? 0 : padding.top);
        width = contentWidth
        height = contentHeight
      }

      if (isInline) {
        const result = {
          x,
          y: y - padding.top + lineHeightOffset,
          width,
          height: fontSize + padding.top + padding.bottom,
        }
        if (this.nodeType === NodeType.TEXT_NODE) {
          const parent = this.parentNode;
          if (parent) {
            const {padding: parentPadding} = parent.style;
            result.y -= parentPadding.top;
            result.height += parentPadding.top + parentPadding.bottom;
          }
        }
        return result;
      }
      return {
        x,
        y,
        width,
        height,
      }
    };

    const clipBox = getClipBox(background.clip);

    if (background.clip === BackgroundClip.contentBox || background.clip === BackgroundClip.paddingBox) {
      clip && clip();
    }

    if (background.color) {
      // debugger;
      context.fillStyle = background.color;
      context.fillRect(clipBox.x, clipBox.y, clipBox.width, clipBox.height);
    }

    if (background.image || background.gradient) {
      const img = this.style.getImage(background.image);
      let originBox = clipBox;
      if (background.origin !== background.clip) {
        originBox = getClipBox(background.origin);
      }

      let left = 0;
      let top = 0;
      let width = 0;
      let height = 0;

      let originWidth = 0;
      let originHeight = 0;
      if (background.image) {
        originWidth = img.imageWidth;
        originHeight = img.imageHeight;
      } else {
        originWidth = clipBox.width;
        originHeight = clipBox.height
      }

      if (background.size.width === BackgroundSize.contain || background.size.width === BackgroundSize.cover) {
        // 等比例缩放 contain 完整放下
        // 等比例缩放 cover 超出裁剪
        if (
          (background.size.width === BackgroundSize.contain && originWidth > originHeight) ||
          (background.size.width === BackgroundSize.cover && originWidth < originHeight)
        ) {
          const ratio = clipBox.width / originWidth;
          width = originWidth * ratio;
          height = originHeight * ratio;
        } else {
          const ratio = clipBox.height / originHeight;
          width = originWidth * ratio;
          height = originHeight * ratio;
        }
      } else {
        if (REG_PX.test(background.size.width)) {
          width = this.style.transformUnitToPx(background.size.width);
        } else if (REG_PCT.test(background.size.width)) {
          width = this.style.transformUnitToPx(
            background.size.width,
            clipBox.width,
          );
        }

        if (REG_PX.test(background.size.height)) {
          height = this.style.transformUnitToPx(background.size.height);
        } else if (REG_PCT.test(background.size.height)) {
          height = this.style.transformUnitToPx(
            background.size.height,
            clipBox.height,
          );
        }

        if (background.size.width === BackgroundSize.auto) {
          // 等比例缩放
          const ratio = height / originHeight;
          width = height ? originWidth * ratio : originWidth;
        }

        if (background.size.height === BackgroundSize.auto) {
          // 等比例缩放
          const ratio = width / originWidth;
          height = width ? originHeight * ratio : originHeight;
        }
      }

      if (width === 0 || height === 0) {
        return;
      }

      if (REG_PX.test(background.position.leftOffset as string)) {
        left = this.style.transformUnitToPx(background.position.leftOffset as string);
      } else if (REG_PCT.test(background.position.leftOffset as string)) {
        left = this.style.transformUnitToPx(
          background.position.leftOffset as string,
          clipBox.width - width,
        );
      }

      if (background.position.left === BackgroundPosition.left) {
        left += originBox.x;
      } else if (background.position.left === BackgroundPosition.right) {
        left = clipBox.width - width - left + originBox.x;
      } else if (background.position.left === BackgroundPosition.center) {
        left += clipBox.width / 2 - width / 2;
      }

      if (REG_PX.test(background.position.topOffset as string)) {
        top = this.style.transformUnitToPx(background.position.topOffset as string);
      } else if (REG_PCT.test(background.position.topOffset as string)) {
        top = this.style.transformUnitToPx(
          background.position.topOffset as string,
          clipBox.height - height,
        );
      }

      if (background.position.top === BackgroundPosition.top) {
        top += originBox.y
      } else if (background.position.top === BackgroundPosition.bottom) {
        top = clipBox.height - height - top + originBox.y;
      } else if (background.position.top === BackgroundPosition.center) {
        top += clipBox.height / 2 - height / 2;
      }

      if (background.gradient) {
        let target: CanvasGradient;
        switch (background.gradient.type) {
          case GradientType.linearGradient:
            target = createLinearGradient(
              context,
              width, height,
              background.gradient,
            );
            break;
        }
        // @ts-ignore
        if (target) {
          drawRepeat(
            context,
            DrawRepeatType.gradient,
            target,
            width,
            height,
            left - clipBox.x,
            top - clipBox.y,
            clipBox.x,
            clipBox.y,
            clipBox.width,
            clipBox.height,
            background.repeat,
          )
        }
      } else if (img && img.source) {
        drawRepeat(
          context,
          DrawRepeatType.image,
          img.source,
          width,
          height,
          left - clipBox.x,
          top - clipBox.y,
          clipBox.x,
          clipBox.y,
          clipBox.width,
          clipBox.height,
          background.repeat,
        )
      }

    }

    context.restore();
  }

  /**
   * 绘制边框
   * @param ctx
   * @param continueDraw
   */
  public drawBorder(this: Draw & Element, ctx: CanvasRenderingContext2D, continueDraw?: TContinueDraw) {
    ctx.save();

    const {border, radius, margin, padding, isBorderBox} = this.style;
    const {offsetLeft, offsetTop, contentHeight, contentWidth} = this;

    const {top, right, bottom, left} = border;
    const {topLeft, topRight, bottomRight, bottomLeft, maxWidth, maxHeight} = radius;

    // 排除边框位置
    const x = offsetLeft + margin.left;
    const y = offsetTop + margin.top;

    const width = contentWidth + (isBorderBox ? 0 : padding.left + padding.right + border.left.width + border.right.width);
    const height = contentHeight + (isBorderBox ? 0 : padding.top + padding.bottom + border.top.width + border.bottom.width);

    ctx.lineCap = 'butt';
    ctx.translate(x, y);

    const hasRadius = !(
      topLeft.width === 0 && topLeft.height === 0 &&
      topRight.width === 0 && topRight.height === 0 &&
      bottomRight.width === 0 && bottomRight.height === 0 &&
      bottomLeft.width === 0 && bottomLeft.height === 0
    );

    const hasBorder = !(
      top.width === 0 &&
      right.width === 0 &&
      bottom.width === 0 &&
      left.width === 0
    )

    const sameWidth = (
      top.width === right.width &&
      right.width === bottom.width &&
      bottom.width === left.width &&
      left.width === top.width
    )

    const sameColor = (
      top.color === right.color &&
      right.color === bottom.color &&
      bottom.color === left.color &&
      left.color === top.color
    )

    const sameStyle = (
      top.style === right.style &&
      right.style === bottom.style &&
      bottom.style === left.style &&
      left.style === top.style
    )

    const isCycle = (
      topLeft.width === maxWidth && topLeft.height === maxHeight &&
      topRight.width === maxWidth && topRight.height === maxHeight &&
      bottomRight.width === maxWidth && bottomRight.height === maxHeight &&
      bottomLeft.width === maxWidth && bottomLeft.height === maxHeight
    );

    const oneDegree = Math.PI / 180;

    const setBorderStyle = (border: IBorder) => {
      // TODO 其他类型支持
      switch (border.style) {
        case BORDER_STYLE.solid:
          ctx.setLineDash([]);
          break;
        case BORDER_STYLE.dashed:
          ctx.setLineDash([border.width * 2, border.width]);
          break;
      }
    }

    const createInnerRoundRect = () => {
      ctx.beginPath();
      if (topLeft.width - left.width > 0 && topLeft.height - top.width > 0) { // 圆角
        ellipse(ctx,
          topLeft.width, topLeft.height,
          topLeft.width - left.width, topLeft.height - top.width, 0,
          Math.PI, oneDegree * -90,
        );
      } else {
        ctx.moveTo(left.width, top.width);
      }

      if (topRight.width - right.width > 0 && topRight.height - top.width > 0) {
        ellipse(ctx,
          width - topRight.width, topRight.height,
          topRight.width - right.width, topRight.height - top.width, 0,
          oneDegree * -90, 0,
        );
      } else {
        ctx.lineTo(width - right.width, top.width);
      }

      if (bottomRight.width - right.width > 0 && bottomRight.height - bottom.width > 0) {
        ellipse(ctx,
          width - bottomRight.width,
          height - bottomRight.height,
          bottomRight.width - right.width, bottomRight.height - bottom.width, 0,
          0, oneDegree * 90,
        );
      } else {
        ctx.lineTo(width - right.width, height - bottom.width);
      }

      if (bottomLeft.width - left.width > 0 && bottomLeft.height - bottom.width > 0) {
        ellipse(ctx,
          bottomLeft.width,
          height - bottomLeft.height,
          bottomLeft.width - left.width, bottomLeft.height - bottom.width, 0,
          oneDegree * 90, Math.PI,
        );
      } else {
        ctx.lineTo(left.width, height - bottom.width);
      }
      ctx.closePath();
    }
    const createOuterRoundRect = () => {
      ctx.beginPath();
      if (topLeft.width > 0 && topLeft.height > 0) { // 圆角
        ellipse(ctx,
          topLeft.width, topLeft.height,
          topLeft.width, topLeft.height, 0,
          Math.PI, oneDegree * -90,
        );
      } else {
        ctx.moveTo(0, 0);
      }

      if (topRight.width > 0 && topRight.height > 0) {
        ellipse(ctx,
          width - topRight.width, topRight.height,
          topRight.width, topRight.height, 0,
          oneDegree * -90, 0,
        );
      } else {
        // ctx.lineTo()
        ctx.lineTo(width, 0);
      }

      if (bottomRight.width > 0 && bottomRight.height > 0) {
        ellipse(ctx,
          width - bottomRight.width,
          height - bottomRight.height,
          bottomRight.width, bottomRight.height, 0,
          0, oneDegree * 90,
        );
      } else {
        ctx.lineTo(width, height);
      }

      if (bottomLeft.width > 0 && bottomLeft.height > 0) {
        ellipse(ctx,
          bottomLeft.width,
          height - bottomLeft.height,
          bottomLeft.width, bottomLeft.height, 0,
          oneDegree * 90, Math.PI,
        );
      } else {
        ctx.lineTo(0, height);
      }
      ctx.closePath();
    }

    /**
     * 多重clip
     * 小程序clip选区必须画出来路径 否则会导致clip是eventodd模式
     */
    const clipPath = () => {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'transparent';
      ctx.stroke();
      ctx.clip();
    }

    if (hasRadius) {
      if (sameWidth && sameStyle && sameColor && isCycle) { // 样式完全一样的 圆形\椭圆形\圆角矩形 一次画完
        // 外圆选区
        if (typeof continueDraw === 'function') {
          ctx.save();
          ctx.beginPath();
          let offset = 0;
          if (this.nodeName === SupportElement.img) {
            offset = top.width;
          }
          ellipse(ctx, width / 2, height / 2, width / 2 - offset, height / 2 - offset, 0, 0, 2 * Math.PI);
          // ctx.clip();
          clipPath();
          continueDraw(ctx);
          ctx.restore();
        }
        if (hasBorder) {
          ctx.beginPath();
          ellipse(ctx,
            width / 2, height / 2,
            width / 2 - top.width / 2, height / 2 - top.width / 2,
            0,
            0, 2 * Math.PI,
          );
          ctx.lineWidth = top.width;
          ctx.strokeStyle = top.color;
          setBorderStyle(top);
          ctx.stroke();
        }
      } else { // 样式不一样的 圆角矩形\圆形\椭圆形
        ctx.save();
        // 外圆选区
        createOuterRoundRect();
        // ctx.stroke();
        clipPath();

        if (hasBorder) {
          if (sameWidth && sameStyle && sameColor) { // 相同样式圆角矩形 一次画完
            if (typeof continueDraw === 'function') {
              ctx.save();
              let hasClip = false;
              continueDraw(ctx, () => {
                if (hasClip) {
                  return;
                }
                createInnerRoundRect();
                ctx.clip();
              });
              ctx.restore()
            }

            // 绘制边框
            {
              const halfWidth = top.width / 2;
              ctx.beginPath();
              if (topLeft.width > 0 && topLeft.height > 0) { // 圆角
                ellipse(ctx,
                  topLeft.width, topLeft.height,
                  topLeft.width - halfWidth, topLeft.height - halfWidth, 0,
                  Math.PI, oneDegree * -90,
                );
              } else {
                ctx.moveTo(0, 0);
              }

              if (topRight.width > 0 && topRight.height > 0) {
                ellipse(ctx,
                  width - topRight.width, topRight.height,
                  topRight.width - halfWidth, topRight.height - halfWidth, 0,
                  oneDegree * -90, 0,
                );
              } else {
                ctx.lineTo(width, 0);
              }

              if (bottomRight.width > 0 && bottomRight.height > 0) {
                ellipse(ctx,
                  width - bottomRight.width,
                  height - bottomRight.height,
                  bottomRight.width - halfWidth, bottomRight.height - halfWidth, 0,
                  0, oneDegree * 90,
                );
              } else {
                ctx.lineTo(width, height);
              }

              if (bottomLeft.width > 0 && bottomLeft.height > 0) {
                ellipse(ctx,
                  bottomLeft.width,
                  height - bottomLeft.height,
                  bottomLeft.width - halfWidth, bottomLeft.height - halfWidth, 0,
                  oneDegree * 90, Math.PI,
                );
              } else {
                ctx.lineTo(0, height);
              }
              ctx.closePath();

              ctx.lineWidth = top.width;
              ctx.strokeStyle = top.color;
              setBorderStyle(top);
              ctx.stroke();
            }

          } else {
            // 边框
            {
              let offset = 0;
              if (width - left.width - right.width > height - top.width - bottom.width) {
                offset = width - left.width - right.width;
              } else {
                offset = height - top.width - bottom.width;
              }
              let xRatio, yRatio;
              // 简单粗暴解决相邻边框衔接处可能缺失
              const scale = 2;

              // 上边
              {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(0, 0);

                xRatio = left.width / (top.width + left.width);
                yRatio = top.width / (top.width + left.width);

                ctx.lineTo(
                  left.width + xRatio * offset,
                  top.width + yRatio * offset,
                );

                xRatio = right.width / (top.width + right.width);
                yRatio = top.width / (top.width + right.width);

                ctx.lineTo(
                  width - right.width - xRatio * offset,
                  top.width + yRatio * offset,
                );

                ctx.lineTo(width, 0);

                ctx.closePath();
                // ctx.clip();
                // ctx.stroke();
                clipPath();

                ctx.beginPath();
                if (topLeft.width - top.width / 2 > 0 && topLeft.height - top.width / 2 > 0) { // 圆角
                  ctx.moveTo(top.width / 2, height / 2);
                  ellipse(ctx,
                    topLeft.width, topLeft.height,
                    topLeft.width - top.width / 2, topLeft.height - top.width / 2, 0,
                    Math.PI, oneDegree * -90,
                  );
                } else {
                  ctx.moveTo(0, top.width / 2);
                }

                if (topRight.width - top.width / 2 > 0 && topRight.height - top.width / 2 > 0) {
                  ellipse(ctx,
                    width - topRight.width, topRight.height,
                    topRight.width - top.width / 2, topRight.height - top.width / 2, 0,
                    oneDegree * -90, 0,
                  );
                  ctx.lineTo(width - width / top.width, height / 2);
                } else {
                  ctx.lineTo(width, top.width / 2);
                }

                ctx.strokeStyle = top.color;
                ctx.lineWidth = top.width * scale;
                setBorderStyle(top);
                ctx.stroke();

                ctx.restore();
              }
              // 右边
              {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(width, 0);

                ctx.lineTo(
                  width - right.width - xRatio * offset,
                  top.width + yRatio * offset,
                );
                xRatio = right.width / (bottom.width + right.width);
                yRatio = bottom.width / (bottom.width + right.width);
                ctx.lineTo(
                  width - right.width - xRatio * offset,
                  height - bottom.width - yRatio * offset,
                );
                ctx.lineTo(width, height);
                ctx.closePath();
                // ctx.stroke();
                // ctx.clip();
                clipPath();

                ctx.beginPath();
                if (topRight.width - right.width / 2 > 0 && topRight.height - right.width / 2 > 0) {
                  ctx.moveTo(width / 2, right.width / 2);
                  ellipse(ctx,
                    width - topRight.width, topRight.height,
                    topRight.width - right.width / 2, topRight.height - right.width / 2, 0,
                    oneDegree * -90, 0,
                  );
                } else {
                  ctx.lineTo(width - right.width / 2, 0);
                }

                if (bottomRight.width - right.width / 2 > 0 && bottomRight.height - right.width / 2 > 0) {
                  ellipse(ctx,
                    width - bottomRight.width, height - bottomRight.height,
                    bottomRight.width - right.width / 2, bottomRight.height - right.width / 2, 0,
                    0, oneDegree * 90,
                  );
                  ctx.lineTo(width / 2, height - right.width / 2);
                } else {
                  ctx.lineTo(width - right.width / 2, height);
                }

                ctx.strokeStyle = right.color;
                ctx.lineWidth = right.width * scale;
                setBorderStyle(right);
                ctx.stroke();

                ctx.restore();
              }
              // 下边
              {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(width, height);
                ctx.lineTo(
                  width - right.width - xRatio * offset,
                  height - bottom.width - yRatio * offset,
                );

                xRatio = left.width / (bottom.width + left.width);
                yRatio = bottom.width / (bottom.width + left.width);

                ctx.lineTo(
                  left.width + xRatio * offset,
                  height - bottom.width - yRatio * offset,
                );
                ctx.lineTo(0, height);
                ctx.closePath();
                // ctx.stroke();
                // ctx.clip();
                clipPath();

                ctx.beginPath();
                if (bottomRight.width - bottom.width / 2 > 0 && bottomRight.height - bottom.width / 2 > 0) {
                  ctx.moveTo(width - bottom.width / 2, height / 2);
                  ellipse(ctx,
                    width - bottomRight.width, height - bottomRight.height,
                    bottomRight.width - bottom.width / 2, bottomRight.height - bottom.width / 2, 0,
                    0, oneDegree * 90,
                  );
                } else {
                  ctx.lineTo(width, height - bottom.width / 2);
                }

                if (bottomLeft.width - bottom.width / 2 > 0 && bottomLeft.height - bottom.width / 2 > 0) {
                  ellipse(ctx,
                    bottomLeft.width, height - bottomLeft.height,
                    bottomLeft.width - bottom.width / 2, bottomLeft.height - bottom.width / 2, 0,
                    oneDegree * 90, Math.PI,
                  );
                  ctx.lineTo(bottom.width / 2, height / 2);
                } else {
                  ctx.lineTo(0, height - bottom.width / 2);
                }

                ctx.strokeStyle = bottom.color;
                ctx.lineWidth = bottom.width * scale;
                setBorderStyle(bottom);
                ctx.stroke();

                ctx.restore();
              }
              // 左边
              {
                ctx.save();

                ctx.beginPath();
                ctx.moveTo(0, height);
                ctx.lineTo(
                  left.width + xRatio * offset,
                  height - bottom.width - yRatio * offset,
                );
                xRatio = left.width / (top.width + left.width);
                yRatio = top.width / (top.width + left.width);
                ctx.lineTo(
                  left.width + xRatio * offset,
                  top.width + yRatio * offset,
                );
                ctx.lineTo(0, 0);
                ctx.closePath();
                // ctx.stroke();
                // ctx.clip();
                clipPath();

                ctx.beginPath();
                if (bottomLeft.width - left.width / 2 > 0 && bottomLeft.height - left.width / 2 > 0) {
                  ctx.moveTo(width / 2, height - left.width / 2);
                  ellipse(ctx,
                    bottomLeft.width, height - bottomLeft.height,
                    bottomLeft.width - left.width / 2, bottomLeft.height - left.width / 2, 0,
                    oneDegree * 90, Math.PI,
                  );
                } else {
                  ctx.lineTo(left.width / 2, height);
                }

                if (topLeft.width - left.width / 2 > 0 && topLeft.height - left.width / 2 > 0) { // 圆角
                  ellipse(ctx,
                    topLeft.width, topLeft.height,
                    topLeft.width - left.width / 2, topLeft.height - left.width / 2, 0,
                    Math.PI, oneDegree * -90,
                  );
                  ctx.lineTo(width / 2, left.width / 2);
                } else {
                  ctx.lineTo(left.width / 2, 0);
                }
                ctx.strokeStyle = left.color;
                ctx.lineWidth = left.width * scale;
                setBorderStyle(left);
                ctx.stroke();

                ctx.restore();
              }
            }

            // 内圆选区
            createInnerRoundRect();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';

            if (typeof continueDraw === 'function') {
              // TODO border-box 无效
              let isClip = false;
              ctx.save();
              continueDraw(ctx, () => {
                if (isClip) {
                  return;
                }
                createInnerRoundRect();
                ctx.clip();
                isClip = true;
              });
              ctx.restore();
            }
          }
        } else {
          if (typeof continueDraw === 'function') {
            continueDraw(ctx);
          }
        }
      }
      ctx.restore();
    } else {
      if (typeof continueDraw === 'function') {
        continueDraw(ctx);
      }

      if (hasBorder) {
        if (sameWidth && sameStyle && sameColor) {
          // 一次画完
          ctx.beginPath();
          ctx.lineWidth = top.width;
          ctx.strokeStyle = top.color;
          setBorderStyle(top);
          ctx.strokeRect(top.width / 2, top.width / 2, width - left.width, height - top.width);
        } else {
          // 上边
          {
            ctx.save();

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(width, 0);
            ctx.lineTo(width - right.width, top.width);
            ctx.lineTo(left.width, top.width);
            ctx.closePath();
            // ctx.stroke();
            ctx.clip();

            ctx.beginPath();
            ctx.translate(0, top.width / 2);
            ctx.strokeStyle = top.color;
            ctx.lineWidth = top.width;
            setBorderStyle(top);
            ctx.moveTo(0, 0);
            ctx.lineTo(width, 0);
            ctx.stroke();

            ctx.restore();
          }

          // 右边
          {
            ctx.save();

            ctx.beginPath();
            ctx.moveTo(width, 0);
            ctx.lineTo(width, height);
            ctx.lineTo(width - right.width, height - bottom.width);
            ctx.lineTo(width - right.width, top.width);
            ctx.closePath();
            // ctx.stroke();
            ctx.clip();

            ctx.beginPath();
            ctx.translate(-right.width / 2, 0);
            ctx.strokeStyle = right.color;
            ctx.lineWidth = right.width;
            setBorderStyle(right);
            ctx.moveTo(width, 0);
            ctx.lineTo(width, height);
            ctx.stroke();

            ctx.restore();
          }

          // 下边
          {
            ctx.save();

            ctx.beginPath();
            ctx.moveTo(width - right.width, height - bottom.width);
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.lineTo(left.width, height - bottom.width);
            ctx.closePath();
            // ctx.stroke();
            ctx.clip();

            ctx.beginPath();
            ctx.translate(0, -bottom.width / 2);
            ctx.strokeStyle = bottom.color;
            ctx.lineWidth = bottom.width;
            setBorderStyle(bottom);
            ctx.moveTo(0, height);
            ctx.lineTo(width, height);
            ctx.stroke();

            ctx.restore();
          }

          // 左边
          {
            ctx.save();

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(left.width, top.width);
            ctx.lineTo(left.width, height - bottom.width);
            ctx.lineTo(0, height);
            ctx.closePath();
            // ctx.stroke();
            ctx.clip();

            ctx.beginPath();
            ctx.translate(left.width / 2, 0);
            ctx.strokeStyle = left.color;
            ctx.lineWidth = left.width;
            setBorderStyle(left);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, height);
            ctx.stroke();

            ctx.restore();
          }
        }
      }
    }
    ctx.restore();
  }

  /**
   * 画文字
   * @param context
   */
  public drawText(this: Draw & Element, context: CanvasRenderingContext2D) {
    context.save();
    const {offsetLeft, offsetTop} = this;
    const {color, verticalAlign, lineHeight, fontSize} = this.style;
    context.font = this.style.canvasFont;
    context.textBaseline = verticalAlign as any;
    context.fillStyle = color;
    const offset = (lineHeight - fontSize) / 2;
    context.fillText(this.displayText, offsetLeft, offsetTop + offset);
    context.restore();
  }

  /**
   * 画文字附加线
   */
  public drawTextDecoration(this: Draw & Element, context: CanvasRenderingContext2D) {
    context.save();
    const {offsetLeft, offsetTop, offsetWidth} = this;
    const {textDecoration, fontSize, lineHeight} = this.style;
    const lineHeightOffset = (lineHeight - fontSize) / 2;

    textDecoration.forEach(decoration => {
      context.beginPath();

      context.strokeStyle = decoration.color;
      context.lineWidth = decoration.thickness;

      let offset = 0;

      switch (decoration.style) {
        case TEXT_DECORATION_STYLE.solid:
          context.setLineDash([]);
          break;
        case TEXT_DECORATION_STYLE.dashed:
          context.setLineDash([4, 2]);
          break;
        case TEXT_DECORATION_STYLE.double:
          context.setLineDash([]);
          break;
        case TEXT_DECORATION_STYLE.wavy:
          // TODO 波浪线
          break;
      }

      switch (decoration.line) {
        case TEXT_DECORATION_LINE.lineThrough:
          offset = fontSize / 2 + lineHeightOffset;
          break;
        case TEXT_DECORATION_LINE.underline:
          offset = fontSize + lineHeightOffset + decoration.thickness / 2;
          break;
        case TEXT_DECORATION_LINE.overline:
          offset = -decoration.thickness / 2 + lineHeightOffset;
          break;
      }

      if (decoration.style === TEXT_DECORATION_STYLE.double) {
        offset -= 2;
        context.moveTo(Math.ceil(offsetLeft), Math.ceil(offsetTop + offset));
        context.lineTo(Math.ceil(offsetLeft + offsetWidth), Math.ceil(offsetTop + offset));
        context.stroke();

        offset += 2;
        context.moveTo(Math.ceil(offsetLeft), Math.ceil(offsetTop + offset));
        context.lineTo(Math.ceil(offsetLeft + offsetWidth), Math.ceil(offsetTop + offset));
        context.stroke();
      } else {
        context.moveTo(Math.ceil(offsetLeft), Math.ceil(offsetTop + offset));
        context.lineTo(Math.ceil(offsetLeft + offsetWidth), Math.ceil(offsetTop + offset));
        context.stroke();
      }

    });
    context.restore();
  }

  /**
   * 绘图主入口
   * @param context
   */
  public draw(this: Draw & Element, context: CanvasRenderingContext2D) {
    const {background: backgroundList, opacity, padding, border, overflow} = this.style;
    const {
      offsetLeft, offsetTop,
      contentWidth, contentHeight,
    } = this;

    if (opacity !== 1) {
      context.save();
      context.globalAlpha = opacity;
    }

    this.drawBorder(context, (ctx, clipInnerRect) => {
      backgroundList.reverse().forEach((background, index) => {
        if (index > 0) {
          background.color = '';
        }
        this.drawBackground(context, background, clipInnerRect);
      });

      if (this.nodeName === SupportElement.img) {
        clipInnerRect && clipInnerRect();
        const img: ElementImage = this as any;
        if (img.source) {
          context.drawImage(img.source, border.left.width, border.top.width, contentWidth, contentHeight);
        }
      }
    });

    if (this.nodeType === NodeType.TEXT_NODE) {
      const {displayText} = this;
      if (displayText) {
        this.drawText(context);
        this.drawTextDecoration(context);
      }
    }

    if (this.debug || (this.root && this.root.debug)) {
      const {offsetWidth, offsetHeight} = this;
      if (offsetWidth) {
        context.save();
        context.strokeStyle = backgroundList[0]?.color || '#333';
        context.strokeRect(offsetLeft, offsetTop, offsetWidth, offsetHeight);
        context.fillStyle = backgroundList[0]?.color || '#ccc';
        context.textBaseline = 'top';
        context.font = '14px sans-serif';
        const text = `${(offsetWidth).toFixed(0)}x${(offsetHeight)}`;
        const textMetrics = context.measureText(text);
        const x = offsetLeft + offsetWidth - textMetrics.width;
        const y = offsetTop;
        context.fillRect(x, y, textMetrics.width, 14);
        context.fillStyle = this.style.color || '#fff';
        context.fillText(text, x, y);
        context.restore();
      }
    }

    if (this.shadow && this.shadow.shadows.indexOf(this) > 0) {
      // inline元素拆分后 只需要渲染第一个的子元素
      return;
    }

    // TODO z-index 和浏览器行为不一致
    const zIndex: Element[] = [];
    this.lines.forEach(line => {
      line.textFlows.forEach(el => {
        if (el.style.isRelative) {
          zIndex.push(el);
        } else {
          el.draw(context);
        }
      });
    });

    this.lines.forEach(line => {
      line.floats.all.forEach(el => {
        if (el.style.isRelative) {
          zIndex.push(el);
        } else {
          el.draw(context);
        }
      });
    });

    this.lines.forEach(line => {
      line.absolutes.forEach(el => {
        zIndex.push(el);
      });
    });

    zIndex.sort((a, b) => a.style.zIndex - b.style.zIndex);

    // if (zIndex.length) {
    //   console.log('sorted', zIndex);
    // }

    zIndex.forEach(el => {
      el.draw(context);
    });

    if (opacity !== 1) {
      context.restore();
    }
  }
}

export default Draw;