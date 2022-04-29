import {BackgroundClip, BackgroundPosition, BackgroundSize, BlockType, DEFAULT_LINE_HEIGHT, NodeType, REG_NUM, REG_PCT, REG_PX, SupportElement, TContinueDraw, TEXT_DECORATION_LINE, TEXT_DECORATION_STYLE} from './constants';
import Style, {IBackground} from './style';
import Line from './line';
import LineManger from './line-manger';
import ElementImage from './element-image';
import {cutCurveEndPath, cutCurveStartPath, drawRepeatImage, ellipse} from './util';

export default class Element {
  public nodeValue = '';
  public contentWidth = 0;
  public contentHeight = 0;
  public left = 0;
  public top = 0;
  public nodeName = '';

  public nodeType = NodeType.ELEMENT_NODE;

  public children: Element[] = [];
  public shadows: Element[] = [];
  public shadow: Element | null = null;

  public style: Style = new Style(this);

  public attrs: any = {};
  public endNode: Element | null = null;

  public parentNode: Element | null = null;
  public prevNode: Element | null = null;
  public nextNode: Element | null = null;

  // @ts-ignore
  public root: Element;

  // @ts-ignore
  public textMetric: { lineHeight: number; width: number };

  public lines = new LineManger(this);
  public line: Line | null = null;
  public lineElement: Element | null = null;

  public clone() {
    const e = new Element();
    Object.assign(e, this);
    return e;
  }

  /**
   * 获取距离最近的block\inline-block元素
   */
  public getNearBlock() {
    let parent = this.parentNode;
    while (parent) {
      const blockType = parent.blockType;
      if (blockType === BlockType.block || blockType === BlockType.inlineBlock) {
        return parent;
      }
      parent = parent.parentNode;
    }
    return parent;
  }

  /**
   * 获取距离最近的relative元素
   */
  public getNearRelativeBlock() {
    let parent = this.parentNode;
    while (parent) {
      if (parent.style.isRelative || parent.style.isAbsolute) {
        return parent;
      }
      if (parent.parentNode) {
        parent = parent.parentNode;
      } else {
        break;
      }
    }
    return parent;
  }

  /**
   * 获取最近有宽度的block元素
   */
  public getNearHasWidthBlock() {
    let parent = this.getNearBlock();
    while (parent) {
      if (parent.style.width && parent.contentWidth) {
        return parent;
      }
      parent = parent.parentNode;
    }
    return null;
  }

  public isInlineORInlineBlock(item: Element) {
    return [BlockType.inline, BlockType.inlineBlock].includes(item.blockType);
  }

  /**
   * 显示文字 处理换行问题
   */
  public get displayText() {
    const text = this.nodeValue.replace(/\s+/g, ' ');
    return text === ' ' ? '' : text.trim();
  }

  /**
   * 元素类型
   * float|absolute元素算作inline-block
   * flex|block|inline|inline-block
   */
  public get blockType(): BlockType {
    const display = this.style.get('display');
    if (this.style.isAbsolute || this.style.isFloat) {
      return BlockType.inlineBlock;
    } else if (display) {
      // TODO 其他类型支持
      return display as BlockType;
    } else if (this.nodeType === NodeType.ELEMENT_NODE || this.nodeType === NodeType.DOCUMENT_NODE) {
      if (/^(span|i|br|strong|a)$/.test(this.nodeName)) {
        return BlockType.inline;
      } else if (/^(img|input|select)$/.test(this.nodeName)) {
        return BlockType.inlineBlock;
      }
      return BlockType.block;
    } else if (this.nodeType === NodeType.TEXT_NODE) {
      return BlockType.inline;
    }
    return BlockType.inline;
  }

  /**
   * block/inline-block = margin + border + padding + content
   * inline = border + padding + content
   * textNode = textWidth
   */
  public get offsetWidth(): number {
    const blockType = this.blockType;
    if (this.nodeType === NodeType.TEXT_NODE) {
      return this.contentWidth;
    }
    const {margin, padding, border} = this.style;
    if (blockType === BlockType.block || blockType === BlockType.inlineBlock) {
      return this.contentWidth + margin.left + margin.right + border.left.width + border.right.width + padding.left + padding.right;
    } else if (blockType === BlockType.inline) {
      return this.contentWidth + border.left.width + border.right.width + padding.left + padding.right;
    }
    return 0;
  };

  /**
   * block/inline-block = margin + border + padding + content
   * inline = border + padding + content
   * textNode = textWidth
   */
  public get offsetHeight(): number {
    const blockType = this.blockType;
    if (this.nodeType === NodeType.TEXT_NODE) {
      return this.contentHeight;
    }
    const {margin, padding, border} = this.style;
    if (blockType === BlockType.block || blockType === BlockType.inlineBlock) {
      return this.contentHeight + margin.top + margin.bottom + border.top.width + border.bottom.width + padding.top + padding.bottom;
    } else if (blockType === BlockType.inline) {
      return this.contentHeight;
    }
    return 0;
  };

  /**
   * 相对于页面的left
   */
  public get offsetLeft(): number {
    if (this.lineElement) {
      return this.lineElement.offsetLeft + this.left;
    }
    return this.left;
  }

  /**
   * 相对于页面的top
   */
  public get offsetTop(): number {
    if (this.lineElement) {
      return this.lineElement.offsetTop + this.top;
    }
    return this.top;
  }

  public get innerHTML() {
    return '';
  }

  public set innerHTML(value) {

  }

  public get firstChild() {
    return this.children[0];
  }

  public get lastChild() {
    return this.children[this.children.length - 1];
  }

  public getTextMetrics(context: CanvasRenderingContext2D, text: string) {
    // TODO letter-spacing 支持
    context.font = this.style.canvasFont;
    const textMetrics = context.measureText(text);
    // let fontHeight = textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent;
    let fontHeight = NaN;
    if (isNaN(fontHeight)) {
      // 兼容不支持测量文字基线的canvas
      fontHeight = this.style.fontSize;
    }
    let lineHeight: string | number = this.style.getInheritStyle('line-height') || DEFAULT_LINE_HEIGHT;
    if (REG_PX.test(lineHeight)) {
      lineHeight = parseFloat(lineHeight);
    } else if (REG_NUM.test(lineHeight)) {
      lineHeight = parseFloat(lineHeight) * fontHeight;
    }
    return {
      width: textMetrics.width,
      lineHeight: lineHeight as number,
    };
  }

  /**
   * 裸文字宽度
   * 固定宽高
   * @param context
   */
  public layoutFixedSize(context: CanvasRenderingContext2D) {
    const blockType = this.blockType;
    if (this.nodeType === NodeType.TEXT_NODE) {
      // text 元素是最小单元 无法嵌套 直接使用文字宽度
      // // TODO letter-spacing 支持
      // context.font = this.style.canvasFont;
      // const textMetrics = context.measureText(this.displayText);
      const textMetrics = this.getTextMetrics(context, this.displayText);
      this.contentWidth = textMetrics.width;
      this.contentHeight = textMetrics.lineHeight;
      this.textMetric = textMetrics;
    } else if (blockType === BlockType.block || blockType === BlockType.inlineBlock) {
      const {width, height} = this.style;
      if (REG_PX.test(width)) {
        // 固定尺寸
        this.contentWidth = this.style.transformUnitToPx(width);
      }
      if (REG_PX.test(height)) {
        // 固定尺寸
        this.contentHeight = this.style.transformUnitToPx(height);
      }
    }

    // 递归计算子节点
    this.children.forEach(el => {
      el.layoutFixedSize(context);
    });
  }

  /**
   * 从父到子
   * @param context
   */
  public layoutInheritWidth(context: CanvasRenderingContext2D) {
    const blockType = this.blockType;
    const {width, padding, border, margin} = this.style;
    if (!width) {
      if (blockType === BlockType.block || blockType === BlockType.inlineBlock) {
        const parent = this.getNearBlock();
        // 继承的宽度不包含
        const offset = padding.left + padding.right + border.left.width + border.right.width + margin.left + margin.right;
        // const offset = 0;
        if (parent) {
          this.contentWidth = parent.contentWidth - offset;
        }
      }
    }
    this.children.forEach(el => {
      el.layoutInheritWidth(context);
    });
  }

  /**
   * 父到子
   * @param context
   */
  public layoutPercentWidth(context: CanvasRenderingContext2D) {
    const blockType = this.blockType;
    if (blockType === BlockType.block || blockType === BlockType.inlineBlock) {
      const {width} = this.style;
      if (REG_PCT.test(width)) {
        // 百分比计算
        const parent = this.getNearBlock();
        if (parent) {
          // 父元素宽度计算百分比
          this.contentWidth = this.style.transformUnitToPx(width, parent.contentWidth);
        }
      }
      if (REG_PCT.test(width)) {
        // 百分比计算
        const parent = this.getNearBlock();
        if (parent && parent.contentHeight) {
          // 父元素高度计算百分比
          this.contentHeight = this.style.transformUnitToPx(width, parent.contentHeight);
        }
      }
    }

    if (this.nodeName === SupportElement.img) {
      const img: ElementImage = this as any as ElementImage;
      // 图片尺寸布局
      const {width, height} = this.style;
      if (width && height) { // 拉伸图片

      } else if (width || height) { // 自适应
        if (width) {
          if (REG_PX.test(width)) { // 固定尺寸 缩放
            const ratio = Math.abs(img.imageWidth - this.contentWidth) / img.imageWidth;
            this.contentHeight = img.imageHeight * ratio;
          } else if (REG_PCT.test(width)) { // 按比例缩放
            this.contentHeight = this.style.transformUnitToPx(width, img.imageHeight);
          }
        } else if (height) {
          if (REG_PX.test(height)) { // 固定尺寸 缩放
            const ratio = Math.abs(img.imageWidth - this.contentWidth) / img.imageWidth;
            this.contentWidth = img.contentWidth * ratio;
          } else if (REG_PCT.test(height)) { // 按比例缩放
            this.contentWidth = this.style.transformUnitToPx(height, img.imageWidth);
          }
        }
      } else {
        // 使用图片宽高
        this.contentWidth = img.imageWidth;
        this.contentHeight = img.imageHeight;
      }
    }

    this.children.forEach(el => {
      el.layoutPercentWidth(context);
    });
  }

  /**
   * inline
   *   小于 当前宽度 直接使用行元素
   *   大于 当前宽度 根据宽度换行
   *   float前一个行元素 最大允许换一行
   *   如果换一行能放下 则float使用 当前行起始位置 或者 结束位置
   *   如果换一行放不下 则float使用 下一行起始位置 或者 结束位置
   *
   *   多个float元素 默认放一行
   *   如果 剩余宽度可以放下超出一行的文字 直接使用剩余宽度
   *   否则 从尾部float元素中 依次换行 直到文字可以放下
   *
   * inline-block 没有宽度情况下
   *   如果文字能放下 则在行内 行剩余宽度可以给后面inline元素使用
   *   如果文字放不下 则从下一行开始 自动换行 剩余宽度独占 其他元素不能使用
   *
   * block元素新起一行 从新计算
   */
  public layoutLine(context: CanvasRenderingContext2D) {
    const blockType = this.blockType;
    const isNoWrap = this.style.isNoWrap;

    if (blockType === BlockType.inlineBlock || blockType === BlockType.block) {
      // 重置行
      this.lines = new LineManger(this);
      let line = this.lines.newLine(this.contentWidth);
      const recursion = (element: Element) => {
        element.lineElement = this;
        element.line = line;
        const childBlockType = element.blockType;
        if (element.nodeType === NodeType.TEXT_NODE) {
          // TODO 浮动元素换行后 后续的文字可以使用剩余宽度
          let textMetrics = element.textMetric;
          // 文字元素 计算文字宽度 无嵌套情况 无需递归
          if (isNoWrap) {
            // 强制不换行
            line.push(element);
          } else {
            // TODO 文字使用float元素换行剩余的位置
            if (!line.append(element)) {
              // 拆分元素换行
              let text = element.displayText;
              let step = text.length * (1 - (line.restWidth / textMetrics.width));
              step = step < 1 ? 1 : step;
              let lineText = text.slice(0, -step);
              element.shadows = [];

              while (text.length) {
                if (line.restWidth <= 0) {
                  line = this.lines.newLine(line.width);
                  continue;
                } else if (lineText === '') {
                  line = this.lines.newLine(line.width);
                  lineText = text;
                  continue;
                }
                textMetrics = element.getTextMetrics(context, lineText);
                const textWidth = textMetrics.width;
                if (textWidth <= line.restWidth) {
                  const el = element.clone();
                  el.nodeValue = lineText;
                  el.contentWidth = textWidth;
                  el.contentHeight = textMetrics.lineHeight;
                  el.textMetric = textMetrics;
                  line.push(el);
                  element.shadows.push(el);
                  el.line = line;
                  element.line = line;
                  el.shadow = element;
                  text = text.slice(lineText.length);
                  if (text.length > step) {
                    lineText = text.slice(0, step);
                  } else {
                    lineText = text;
                  }
                } else {
                  step = lineText.length * (1 - (line.restWidth / textMetrics.width));
                  step = step < 1 ? 1 : step;
                  lineText = lineText.slice(0, -step);
                }
              }
              // element.contentHeight = element.shadows.length * textMetrics.lineHeight;
            } else {
              element.contentHeight = textMetrics.lineHeight;
            }
          }
        } else if (element.nodeType === NodeType.ELEMENT_NODE && childBlockType === BlockType.inline) {
          if (element.nodeName === SupportElement.br || element.nodeName === SupportElement.hr) {
            // br\hr 元素 强制换行
            element.contentHeight = this.root.textMetric.lineHeight;
            // if (line.restWidth <= 0) {
            line = this.lines.newLine(line.width);
            line.push(element);
            element.line = line;
            // element.contentWidth = line.restWidth;
            // } else {
            // line.push(element);
            // element.contentWidth = line.restWidth;
            // }
          } else {
            if (isNoWrap) {
              line.push(element);
              // 递归计算子节点
              element.children.forEach(recursion);
            } else {
              const splitPush = () => {
                let lastLine = this.lines.lastLine();
                const half = element.clone();
                half.shadow = element;
                element.shadows.push(half);
                half.contentWidth -= half.offsetWidth / 2;
                if (!lastLine.append(half)) {
                  // inline元素
                  lastLine = this.lines.newLine(line.width);
                  lastLine.push(half);
                }
                half.line = lastLine;
                return half;
              }
              // 左侧进入布局
              const left = splitPush();
              // 递归计算子节点
              element.children.forEach(recursion);
              // 右侧进入布局
              const right = splitPush();
              const textChild = this.children.find(i => i.nodeType === NodeType.TEXT_NODE && i.contentHeight);
              if (textChild) {
                left.contentHeight = right.contentHeight = textChild.offsetHeight;
              }
            }
          }
        } else {
          // inline-block\block嵌套 递归布局
          if (childBlockType === BlockType.inlineBlock) {
            // inline block 是行内元素 自动换行排列 所以不需要继承上一行的float
            element.line = null;
          } else {
            // block 是块元素 需要换行 但是文字需要排除溢出的float宽度 所以需要继承上一行的float
            element.line = line;
          }

          // TODO img 标签优化
          element.layoutLine(context);

          if (childBlockType === BlockType.inlineBlock) {
            // 计算真正的inline-block占用宽度

            if (element.nodeName === SupportElement.img) {

            } else {
              // TODO 宽度可能不准确 因为如果是手写是百分比宽度的话 则会出现异常
              // TODO 块元素宽度应该不包含换行宽度
              if (!element.style.width) {
                element.contentWidth = Math.max(...element.lines.map(i => i.usedWidth));
              }

              // TODO 高度可能不准确 因为如果是手写是百分比高度的话 则会出现异常
              if (!element.style.height) {
                element.contentHeight = element.lines.linesHeight;
              }
            }

            if (element.style.isAbsolute) {
              let relativeBlock = element.getNearRelativeBlock() || this.root;
              const relLine = relativeBlock.lines.lastLineOrNewLine(relativeBlock.contentWidth);
              element.lineElement = relativeBlock;
              element.line = relLine;
              relLine.push(element);
            } else {
              if (isNoWrap) {
                line.push(element);
              } else {
                while (!line.append(element)) {
                  line = this.lines.newLine(line.width);
                  // 强制换行 避免死循环
                  if (element.offsetWidth > line.width) {
                    line.push(element);
                    console.log('死循环 强制换行');
                    break;
                  }
                }
                element.line = line;
              }
            }
          } else if (childBlockType === BlockType.block) {
            if (line.length) {
              line = this.lines.newLine(line.width);
            }
            line.push(element);
            element.line = line;
            line = this.lines.newLine(line.width);
            // TODO 高度可能不准确 因为如果是手写是百分比高度的话 则会出现异常
            if (element.nodeName === SupportElement.img) {

            } else {
              if (!element.style.height) {
                element.contentHeight = element.lines.linesHeight;
              }
            }
          }

          // TODO BFC 闭合逻辑错误
          //  应该是
          //  inline-block
          //  overflow: 非 visible
          //  clear
          //  闭合
          const childNewLine = element.lines.newLine(line.width);
          element.lines.pop();
          const lastLine = element.lines.lastLine();

          // 子元素浮动超出文字布局 当前元素需要继承超出的float元素
          if (lastLine && (lastLine.overLeftHeight || lastLine.overRightHeight)) {
            const newLine = this.lines.newLine(line.width);
            if (childBlockType === BlockType.block) {
              Object.assign(newLine, childNewLine);
              line = newLine;
            } else if (childBlockType === BlockType.inlineBlock) {
              // 空行插入占位元素 填充剩余高度
              const height = Math.max(lastLine.overLeftHeight, lastLine.overRightHeight);
              const e = new Element()
              e.nodeName = '#placholder';
              e.nodeValue = '';
              e.contentHeight = height;
              newLine.push(e);
            }
            // console.log('last overflow', element.nodeValue, lastLine, newLine);
          }
        }
      }

      this.children.forEach(recursion);

      if (this.nodeName === SupportElement.img) {

      } else {
        // TODO 百分比高度会有问题
        if (!this.style.height) {
          this.contentHeight = this.lines.linesHeight;
        }
      }
    } else {
      this.children.forEach(e => e.layoutLine(context));
    }
    return;
  }

  public layoutLinePosition() {
    const {margin, border, padding} = this.style;
    const textAlign = this.style.getInheritStyle('text-align') || 'left';
    const blockType = this.blockType;
    let contentOffsetTop = 0;
    let contentOffsetLeft = 0;
    let contentOffsetRight = 0;
    // TODO box-sizing 支持
    if (blockType === BlockType.block || blockType === BlockType.inlineBlock) {
      contentOffsetLeft = margin.left + border.left.width + padding.left;
      contentOffsetRight = margin.left + border.left.width + padding.left;
      contentOffsetTop = margin.top + border.top.width + padding.top;
    } else if (blockType === BlockType.inline) {
      contentOffsetLeft = border.left.width + padding.left;
    }

    /**
     * 每一行元素的left、top值
     */
    let top = contentOffsetTop;

    const absolutes: Element[] = [];
    this.lines.forEach(line => {
      let left = line.holdLeftWidth + contentOffsetLeft;
      const {textFlows, floats, absolutes: lineAbsolutes} = line;
      let floatLeft = 0;
      let floatRight = line.holdRightWidth;
      floats.left.forEach(float => {
        float.top = top;
        float.left = left + floatLeft;
        floatLeft += float.offsetWidth;
      })
      floats.right.forEach(float => {
        float.top = top;
        floatRight += float.offsetWidth;
        float.left = this.contentWidth - floatRight + contentOffsetRight;
      })
      textFlows.forEach(el => {
        let offset = 0;
        // text-align
        // 实际元素剩余宽度
        const restWidth = this.contentWidth - line.usedWidth - line.holdLeftWidth - line.holdRightWidth;
        if (el.blockType !== BlockType.block) {
          // block元素独占一行 只有非block元素才需要重新计算坐标
          if (textAlign === 'center') {
            offset = restWidth / 2;
          } else if (textAlign === 'right') {
            offset = restWidth;
          }
        }
        el.left = floatLeft + left + offset;
        el.top = top;
        left += el.offsetWidth;
      })
      line.forEach(el => {
        el.layoutLinePosition();

        // TODO margin 负值布局错误
        if (el.blockType === BlockType.block) {
          // block前面有float元素偏移问题
          el.left -= line.holdLeftWidth;

          // margin: 0 auto; 移动盒子位置
          const originMargin = el.style.getOriginRoundStyle('margin');
          // @ts-ignore
          if (originMargin.left === 'auto' && originMargin.right === 'auto') {
            if (el.line) {
              el.left += el.line.restWidth / 2;
            }
          }
        }
      });
      top += line.height;
      absolutes.push(...lineAbsolutes);
    });

    absolutes.forEach(absolute => {
      const absoluteTop = absolute.style.get('top');
      const absoluteRight = absolute.style.get('right');
      const absoluteBottom = absolute.style.get('bottom');
      const absoluteLeft = absolute.style.get('left');

      let target: Element = this;
      const shadows: Element[] = [];
      target.lineElement?.lines.forEach(line => {
        line.forEach(i => {
          if (
            (i.parentNode === target) ||
            (i.parentNode === target.shadow)
          ) {
            shadows.push(i);
          }
        })
      });

      const isInline = target.blockType === BlockType.inline;
      /**
       * 上下左右 全都写的情况下
       * 有宽高 忽略左右
       * 没宽高 适应宽高
       */

      if (isInline) {
        if (absoluteLeft && absoluteRight) {
          // 同时有左右
          target = shadows[0] || target;
          const left = target.left + absolute.style.transformUnitToPx(absoluteLeft);
          absolute.left = left;
          if (!absolute.style.width) {
            const last = shadows[shadows.length - 1] || target;
            absolute.contentWidth = (last.left + last.contentWidth) - left - absolute.style.transformUnitToPx(absoluteRight);
          }
        } else if (absoluteLeft) {
          target = shadows[0] || target;
          absolute.left = target.left + absolute.style.transformUnitToPx(absoluteLeft)
        } else if (absoluteRight) {
          target = shadows[shadows.length - 1] || target;
          absolute.left = target.left + target.contentWidth - absolute.offsetWidth - absolute.style.transformUnitToPx(absoluteRight);
        }

        // 同时有上下
        if (absoluteTop && absoluteBottom) {
          target = shadows[0] || target;
          absolute.top = target.top + absolute.style.transformUnitToPx(absoluteTop);
          if (!absolute.style.height) {
            const last = shadows[shadows.length - 1] || target;
            absolute.contentHeight = last.top + last.contentHeight - absolute.top - absolute.style.transformUnitToPx(absoluteBottom);
          }
        } else if (absoluteTop) {
          target = shadows[0] || target;
          absolute.top = target.top + absolute.style.transformUnitToPx(absoluteTop);
        } else if (absoluteBottom) {
          target = shadows[shadows.length - 1] || target;
          absolute.top = target.top + target.contentHeight - absolute.offsetHeight - absolute.style.transformUnitToPx(absoluteBottom);
        }
      } else {
        if (absoluteLeft && absoluteRight) {
          // 同时有左右
          const left = absolute.style.transformUnitToPx(absoluteLeft);
          absolute.left = left;
          if (!absolute.style.width) {
            absolute.contentWidth = target.contentWidth - left - absolute.style.transformUnitToPx(absoluteRight);
          }
        } else if (absoluteLeft) {
          absolute.left = absolute.style.transformUnitToPx(absoluteLeft)
        } else if (absoluteRight) {
          absolute.left = target.contentWidth - absolute.offsetWidth - absolute.style.transformUnitToPx(absoluteRight)
        }
        // 同时有上下
        if (absoluteTop && absoluteBottom) {
          const t = absolute.style.transformUnitToPx(absoluteTop);
          absolute.top = t
          if (!absolute.style.height) {
            absolute.contentHeight = target.contentHeight - t - absolute.style.transformUnitToPx(absoluteBottom);
          }
        } else if (absoluteTop) {
          absolute.top = absolute.style.transformUnitToPx(absoluteTop);
        } else if (absoluteBottom) {
          absolute.top = target.contentHeight - absolute.offsetHeight - absolute.style.transformUnitToPx(absoluteBottom);
        }
      }
      absolute.layoutLinePosition();
    })
  }

  public layout(context: CanvasRenderingContext2D) {
    this.textMetric = this.getTextMetrics(context, '');
    /**
     * 裸文字宽度
     * 固定宽度
     * inline-block 内容宽度
     * block 继承宽度
     * 百分比宽度
     * -----
     * 计算文字高度
     * 计算行内元素高度
     * -----
     * 计算起始坐标
     */
    /**
     * 1、裸文字宽度
     * 2、固定宽高
     */
    this.layoutFixedSize(context);
    /**
     * 3、inline-block 内容宽度
     * 4、block 继承宽度
     */
    this.layoutInheritWidth(context);

    /**
     * 计算百分比宽高
     */
    this.layoutPercentWidth(context);

    /**
     * 计算文字布局
     */
    this.layoutLine(context);

    /**
     * 计算行内元素 坐标起点
     */
    this.layoutLinePosition();
  }

  /**
   * 绘制元素背景图 不包含margin区域
   * @param context
   * @param background
   */
  public drawBackground(context: CanvasRenderingContext2D, background: IBackground<string>) {
    context.save();
    const {border, padding, fontSize} = this.style;
    const {contentWidth, contentHeight} = this;

    const isInline = this.blockType === BlockType.inline;

    const getClipBox = (clip: BackgroundClip) => {
      let x = 0;
      let y = 0;
      let width = 0;
      let height = 0;
      if (clip === BackgroundClip.borderBox) {
        x = 0;
        y = 0;
        width = contentWidth + padding.left + padding.right + border.left.width + border.right.width;
        height = contentHeight + padding.top + padding.bottom + border.top.width + border.bottom.width;
      } else if (clip === BackgroundClip.paddingBox) {
        x = border.left.width;
        y = border.top.width;
        width = contentWidth + padding.left + padding.right
        height = contentHeight + padding.top + padding.bottom
      } else if (clip === BackgroundClip.contentBox) {
        x = border.left.width + padding.left;
        y = border.top.width + padding.top;
        width = contentWidth
        height = contentHeight
      }

      if (isInline) {
        const result = {
          x,
          y: y - padding.top,
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
    if (background.color) {
      context.fillStyle = background.color;
      context.fillRect(clipBox.x, clipBox.y, clipBox.width, clipBox.height);
    }

    if (background.image) {
      const img = this.style.getImage(background.image);
      if (img && img.source) {
        let originBox = clipBox;
        if (background.origin !== background.clip) {
          originBox = getClipBox(background.origin);
        }

        let left = 0;
        let top = 0;
        let width = 0;
        let height = 0;

        if (background.size.width === BackgroundSize.contain || background.size.width === BackgroundSize.cover) {
          // 等比例缩放 contain 完整放下
          // 等比例缩放 cover 超出裁剪
          if (
            (background.size.width === BackgroundSize.contain && img.imageWidth > img.imageHeight) ||
            (background.size.width === BackgroundSize.cover && img.imageWidth < img.imageHeight)
          ) {
            const ratio = clipBox.width / img.imageWidth;
            width = img.imageWidth * ratio;
            height = img.imageHeight * ratio;
          } else {
            const ratio = clipBox.height / img.imageHeight;
            width = img.imageWidth * ratio;
            height = img.imageHeight * ratio;
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
            const ratio = height / img.imageHeight;
            width = img.imageWidth * ratio;
          }

          if (background.size.height === BackgroundSize.auto) {
            // 等比例缩放
            const ratio = width / img.imageWidth;
            height = img.imageHeight * ratio;
          }
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

        drawRepeatImage(
          context,
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
  public drawBorder(ctx: CanvasRenderingContext2D, continueDraw?: TContinueDraw) {
    ctx.save();

    const {border, radius, margin} = this.style;
    const {offsetLeft, offsetTop, offsetWidth, offsetHeight} = this;

    const {top, right, bottom, left} = border;
    const {topLeft, topRight, bottomRight, bottomLeft, maxWidth, maxHeight} = radius;

    // 排除边框位置
    const x = offsetLeft + margin.left;
    const y = offsetTop + margin.top;

    const width = offsetWidth - margin.left - margin.right;
    const height = offsetHeight - margin.top - margin.bottom;

    ctx.lineCap = 'butt';
    ctx.translate(x, y);

    const noRadius = (
      topLeft.width === 0 && topLeft.height === 0 &&
      topRight.width === 0 && topRight.height === 0 &&
      bottomRight.width === 0 && bottomRight.height === 0 &&
      bottomLeft.width === 0 && bottomLeft.height === 0
    );

    const noBorder = (
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

    if (noRadius && !noBorder) {
      if (typeof continueDraw === 'function') {
        ctx.save();
        ctx.rect(0, 0, width, height);
        ctx.clip();
        continueDraw(ctx);
        ctx.restore();
      }

      // 矩形
      if (sameWidth && sameStyle && sameColor) {
        // 一次画完
        ctx.beginPath();
        ctx.lineWidth = top.width;
        ctx.strokeStyle = top.color;
        ctx.strokeRect(top.width / 2, top.width / 2, width, height);
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
          ctx.clip();

          ctx.save();
          ctx.beginPath();
          ctx.translate(0, top.width / 2);
          ctx.strokeStyle = top.color;
          ctx.lineWidth = top.width;
          ctx.moveTo(0, 0);
          ctx.lineTo(width, 0);
          ctx.stroke();
          ctx.restore();

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

          ctx.save();
          ctx.beginPath();
          ctx.translate(-right.width / 2, 0);
          ctx.strokeStyle = right.color;
          ctx.lineWidth = right.width;
          ctx.moveTo(width, 0);
          ctx.lineTo(width, height);
          ctx.stroke();
          ctx.restore();

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

          ctx.save();
          ctx.beginPath();
          ctx.translate(0, -bottom.width / 2);
          ctx.strokeStyle = bottom.color;
          ctx.lineWidth = bottom.width;
          ctx.moveTo(0, height);
          ctx.lineTo(width, height);
          ctx.stroke();
          ctx.restore();

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

          ctx.save();
          ctx.beginPath();
          ctx.translate(left.width / 2, 0);
          ctx.strokeStyle = left.color;
          ctx.lineWidth = left.width;
          ctx.moveTo(0, 0);
          ctx.lineTo(0, height);
          ctx.stroke();
          ctx.restore();

          ctx.restore();
        }
      }
    } else if (!noBorder && !noRadius && isCycle) {
      const halfLineWidth = top.width / 2;
      if (maxHeight === maxWidth) { // 正圆
        if (sameColor && sameStyle && sameWidth) { // 样式完全一致 直接一次画完
          ctx.lineWidth = top.width;
          ctx.strokeStyle = top.color;
          ctx.beginPath();
          ctx.arc(
            width / 2,
            height / 2,
            width / 2 - halfLineWidth, 0, 2 * Math.PI,
          );
          ctx.stroke();
        } else {
          if (sameWidth) {
            // 左上角
            const halfSize = width / 2 - halfLineWidth;
            ctx.lineWidth = top.width;
            const oneDegree = Math.PI / 180;
            // 上弧
            ctx.strokeStyle = top.color;
            ctx.beginPath();
            ctx.arc(
              halfSize + halfLineWidth, halfSize + halfLineWidth,
              halfSize,
              oneDegree * 225, oneDegree * 315,
            );
            ctx.stroke();

            // 右弧
            ctx.strokeStyle = right.color;
            ctx.beginPath();
            ctx.arc(
              halfSize + halfLineWidth, halfSize + halfLineWidth,
              halfSize,
              oneDegree * -45, oneDegree * 45,
            );
            ctx.stroke();

            // 下弧
            ctx.strokeStyle = bottom.color;
            ctx.beginPath();
            ctx.arc(
              halfSize + halfLineWidth, halfSize + halfLineWidth,
              halfSize,
              oneDegree * 45, oneDegree * 135,
            );
            ctx.stroke();

            // 左弧
            ctx.strokeStyle = left.color;
            ctx.beginPath();
            ctx.arc(
              halfSize + halfLineWidth, halfSize + halfLineWidth,
              halfSize,
              oneDegree * 135, oneDegree * 225,
            );

            ctx.stroke();

          } else {
            // TODO 线条宽度不一致 需要重新画
          }
        }

        if (typeof continueDraw === 'function') {
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            width / 2,
            height / 2,
            width / 2 - halfLineWidth, 0, 2 * Math.PI,
          );
          ctx.clip();
          continueDraw(ctx);
          ctx.restore();
        }
      } else { //  椭圆
        // TODO 椭圆支持分线段画图
        ctx.beginPath();
        ellipse(ctx, width / 2, height / 2, width - top.width, height - top.width);

        if (typeof continueDraw === 'function') {
          ctx.save();
          ctx.clip();
          continueDraw(ctx);
          ctx.restore();
        }

        ctx.lineWidth = top.width;
        ctx.strokeStyle = top.color;
        ctx.stroke();
      }
    } else if (!noBorder && !noRadius) {
      // 圆角矩形
      if (sameWidth) {
        ctx.save()
        ctx.translate(top.width / 2, top.width / 2);
        // 上边框
        {
          ctx.strokeStyle = top.color;
          ctx.lineWidth = top.width;
          {
            ctx.beginPath();
            const [p1, p2, p3] = cutCurveEndPath([
              [0, topLeft.height],
              [0, 0],
              [topLeft.width, 0],
            ], 0.5);
            ctx.moveTo(...p1);
            ctx.quadraticCurveTo(...p2, ...p3);
          }

          {
            const [p1, p2, p3] = cutCurveStartPath([
              [width - topRight.width - right.width, 0],
              [width - right.width, 0],
              [width - right.width, topRight.height],
            ], 0.5);
            ctx.lineTo(...p1);
            ctx.quadraticCurveTo(...p2, ...p3);
            ctx.stroke();
          }
        }

        // 右边框
        {
          ctx.strokeStyle = right.color;
          ctx.lineWidth = right.width;
          {
            ctx.beginPath();
            const [p1, p2, p3] = cutCurveEndPath([
              [width - topRight.width - right.width, 0],
              [width - right.width, 0],
              [width - right.width, topRight.height],
            ], 0.5);
            ctx.moveTo(...p1);
            ctx.quadraticCurveTo(...p2, ...p3);
          }

          {
            const [p1, p2, p3] = cutCurveStartPath([
              [width - right.width, height - bottomRight.height - bottom.width],
              [width - right.width, height - bottom.width],
              [width - right.width - bottomRight.width, height - bottom.width],
            ], 0.5);
            ctx.lineTo(...p1);
            ctx.quadraticCurveTo(...p2, ...p3);
            ctx.stroke();
          }
        }

        // 下边框
        {
          ctx.strokeStyle = bottom.color;
          ctx.lineWidth = bottom.width;
          {
            ctx.beginPath();
            const [p1, p2, p3] = cutCurveEndPath([
              [width - right.width, height - bottomRight.height - bottom.width],
              [width - right.width, height - bottom.width],
              [width - right.width - bottomRight.width, height - bottom.width],
            ], 0.5);
            ctx.moveTo(...p1);
            ctx.quadraticCurveTo(...p2, ...p3);
          }

          {
            const [p1, p2, p3] = cutCurveStartPath([
              [bottomLeft.width, height - bottom.width],
              [0, height - bottom.width],
              [0, height - bottomLeft.height - bottom.width],
            ], 0.5);
            ctx.lineTo(...p1);
            ctx.quadraticCurveTo(...p2, ...p3);
            ctx.stroke();
          }
        }

        // 左边框
        {
          ctx.strokeStyle = left.color;
          ctx.lineWidth = left.width;
          {
            ctx.beginPath();
            const [p1, p2, p3] = cutCurveEndPath([
              [bottomLeft.width, height - bottom.width],
              [0, height - bottom.width],
              [0, height - bottomLeft.height - bottom.width],
            ], 0.5);
            ctx.moveTo(...p1);
            ctx.quadraticCurveTo(...p2, ...p3);
          }

          {
            const [p1, p2, p3] = cutCurveStartPath([
              [0, topLeft.height],
              [0, 0],
              [topLeft.width, 0],
            ], 0.5);
            ctx.lineTo(...p1);
            ctx.quadraticCurveTo(...p2, ...p3);
            ctx.stroke();
          }
        }

        ctx.restore();
      } else {
        // TODO 处理 宽度不一致
      }

      // 外切圆角矩形 顺时针绘制
      const roundPath = new Path2D();
      // 上边 + 右上角
      roundPath.moveTo(topLeft.width, 0);
      roundPath.lineTo(width - topRight.width, 0);
      roundPath.quadraticCurveTo(width, 0, width, topRight.height);

      // 右边 + 右下角
      roundPath.lineTo(width, height - bottomRight.height);
      roundPath.quadraticCurveTo(width, height, width - bottomRight.width, height);

      // 下边 + 左下角
      roundPath.lineTo(bottomLeft.width, height)
      roundPath.quadraticCurveTo(0, height, 0, height - bottomLeft.height);

      // 左边 + 左上角
      roundPath.lineTo(0, topLeft.height);
      roundPath.quadraticCurveTo(0, 0, topLeft.width, 0);
      roundPath.closePath();

      if (typeof continueDraw === 'function') {
        ctx.save();
        ctx.clip();
        continueDraw(ctx);
        ctx.restore();
      }
    } else {
      if (typeof continueDraw === 'function') {
        continueDraw(ctx);
      }
    }

    ctx.restore();
  }

  /**
   * 画文字
   * @param context
   */
  public drawText(context: CanvasRenderingContext2D) {
    context.save();
    const {offsetLeft, offsetTop} = this;
    const {color, verticalAlign} = this.style;
    context.font = this.style.canvasFont;
    context.textBaseline = verticalAlign as any;
    context.fillStyle = color;
    context.fillText(this.displayText, offsetLeft, offsetTop);
    context.restore();
  }

  /**
   * 画文字附加线
   */
  public drawTextDecoration(context: CanvasRenderingContext2D) {
    context.save();
    const {offsetLeft, offsetTop, offsetWidth} = this;
    const {textDecoration, fontSize} = this.style;
    textDecoration.forEach(decoration => {
      context.strokeStyle = decoration.color;
      context.lineWidth = decoration.thickness;

      let offset = decoration.thickness / 2;

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
          offset += fontSize / 2;
          break;
        case TEXT_DECORATION_LINE.underline:
          offset += fontSize;
          break;
      }

      if (decoration.style === TEXT_DECORATION_STYLE.double) {
        offset -= 3;
        context.moveTo(Math.ceil(offsetLeft), Math.ceil(offsetTop + offset));
        context.lineTo(Math.ceil(offsetLeft + offsetWidth), Math.ceil(offsetTop + offset));
        context.stroke();

        offset += 3;
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

  public draw(context: CanvasRenderingContext2D) {
    const {background: backgroundList} = this.style;
    const {
      offsetLeft, offsetTop,
      contentWidth, contentHeight,
      offsetWidth, offsetHeight,
    } = this;

    this.drawBorder(context, () => {
      backgroundList.reverse().forEach((background, index) => {
        if (index > 0) {
          background.color = '';
        }
        this.drawBackground(context, background);
      });
    });

    if (this.nodeType === NodeType.TEXT_NODE) {
      const {displayText} = this;
      if (displayText) {
        this.drawText(context);
        this.drawTextDecoration(context);
      }
    } else if (this.blockType === BlockType.inlineBlock || this.blockType === BlockType.block) {
      // context.strokeStyle = '#00f';
      // context.strokeRect(offsetLeft, offsetTop, offsetWidth, offsetHeight);
    }

    if (this.nodeName === SupportElement.img) {
      const img: ElementImage = this as any;
      if (img.source) {
        context.drawImage(img.source, offsetLeft, offsetTop, contentWidth, contentHeight);
      }
    }

    this.lines.forEach(line => {
      line.textFlows.forEach(el => el.draw(context));
    })
    this.lines.forEach(line => {
      line.floats.all.forEach(el => el.draw(context));
    })
    this.lines.forEach(line => {
      line.absolutes.forEach(el => el.draw(context));
    })
  }
}
