import {BackgroundPosition, BackgroundSize, BlockType, DEFAULT_COLOR, DEFAULT_LINE_HEIGHT, NodeType, REG_NUM, REG_PCT, REG_PX, SupportElement} from './constants';
import Style from './style';
import Line from './line';
import LineManger from './line-manger';
import ElementImage from './element-image';
import {drawRepeatImage} from './util';

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

  public getInlineChildWidth() {
    let inlineWidth = 0;
    const width = this.children.reduce((total, cur) => {
      const type = cur.blockType;
      if (type === BlockType.inline) {
        // TODO 文字换行处理
        // 文字如果可以换行 则只有左半部分的padding + border
        total += cur.offsetWidth;
      } else if (type === BlockType.inlineBlock) {
        // inline-block 直接使用offsetWidth
        total += cur.offsetWidth;
      } else {
        inlineWidth = total;
        total = 0;
      }
      return total;
    }, 0);
    return Math.max(inlineWidth, width);
  }

  public isInlineORInlineBlock(item: Element) {
    return [BlockType.inline, BlockType.inlineBlock].includes(item.blockType);
  }

  /**
   * inline-block
   * 1、block元素宽度
   * 2、不换行的文字宽度
   * max(1, 2)
   */
  public getMaxChildWidth() {
    let maxBlockWidth = 0;
    let inlineWidth = 0;
    const isNoWrap = this.style.isNoWrap;

    // 合并连续行元素宽度
    for (let i = 0; i < this.children.length; i++) {
      const item = this.children[i];
      const prev = this.children[i - 1];

      if (item.blockType === BlockType.block) {
        // 强制不换行情况下 出现block则清空累计的inline、inline-block宽度
        maxBlockWidth = Math.max(
          maxBlockWidth,
          isNoWrap ? inlineWidth : 0,
          item.offsetWidth,
        );
        inlineWidth = 0;
      } else if (this.isInlineORInlineBlock(item)) {
        if (isNoWrap) { // 强制不换行
          if (prev && this.isInlineORInlineBlock(prev)) {
            inlineWidth += item.offsetWidth;
          } else {
            inlineWidth = item.offsetWidth;
          }
        } else {
          // 行元素宽度自动按照block元素宽度换行 所以行元素没有宽度
          // inlineWidth = item.offsetWidth;
        }
      }
    }
    return Math.max(maxBlockWidth, inlineWidth);
  }

  /**
   * 显示文字 处理换行问题
   */
  public get displayText() {
    const text = this.nodeValue.replace(/\s+/g, ' ');
    return text === ' ' ? '' : text;
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
      contentOffsetRight = margin.right + border.right.width + padding.right;
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

  public drawRepeatImage() {

  }

  public draw(context: CanvasRenderingContext2D) {
    const {
      background: backgroundList,
      margin,
      border,
      padding,
      lineHeight,
      fontSize,
    } = this.style;
    const {
      offsetLeft, offsetTop,
      offsetWidth, offsetHeight,
      contentWidth, contentHeight,
    } = this;
    let offset = 0;
    if (this.blockType === BlockType.inline) {
      offset = (lineHeight * fontSize) - fontSize;
    }

    backgroundList.forEach(background => {
      if (background.color) {
        context.fillStyle = background.color;
        // console.log(offset, fontSize, lineHeight);
        context.fillRect(
          offsetLeft + margin.left + border.left.width,
          offsetTop + margin.top + border.top.width,
          offsetWidth - margin.left - margin.right - border.left.width - border.right.width,
          offsetHeight - margin.top - margin.bottom - border.top.width - border.bottom.width - offset,
        );
      }

      if (background.image) {
        const img = this.style.getImage(background.image);
        if (img && img.source) {
          console.log('background image', background)

          let left = 0
          let top = 0;
          let width = 100;
          let height = 100;

          if (background.position.left === BackgroundPosition.left) {
            left = offsetLeft;
          } else if (background.position.left === BackgroundPosition.right) {
            left = offsetLeft + offsetWidth - width;
          } else if (background.position.left === BackgroundPosition.center) {
            left = (offsetLeft + offsetWidth) / 2 - width / 2;
          } else if (REG_PX.test(background.position.left as string)) {
            left = offsetLeft + this.style.transformUnitToPx(background.position.left as string);
          } else if (REG_PCT.test(background.position.left as string)) {
            left = offsetLeft + this.style.transformUnitToPx(
              background.position.left as string,
              offsetWidth - width,
            );
          }

          if (background.position.top === BackgroundPosition.top) {
            top = offsetTop
          } else if (background.position.top === BackgroundPosition.bottom) {
            top = offsetTop + offsetHeight - height;
          } else if (background.position.top === BackgroundPosition.center) {
            top = (offsetTop + offsetHeight) / 2 - height / 2;
          } else if (REG_PX.test(background.position.top as string)) {
            top = offsetTop + this.style.transformUnitToPx(background.position.top as string);
          } else if (REG_PCT.test(background.position.top as string)) {
            top = offsetTop + this.style.transformUnitToPx(
              background.position.top as string,
              offsetHeight - height,
            );
          }
          // console.log(offsetLeft, offsetTop, offsetWidth, offsetHeight, img.imageWidth, img.imageHeight);
          console.log(left, top, width, height, background);

          drawRepeatImage(
            context,
            img.source,
            width,
            height,
            offsetLeft,
            offsetTop,
            left, top,
            offsetWidth,
            offsetHeight,
            background.repeat,
          )
        }
      }
    });

    if (this.nodeType === NodeType.TEXT_NODE) {
      const {displayText} = this;
      if (displayText) {
        const textBaseline = this.style.get('vertical-align') || 'top';
        const color = this.style.getInheritStyle('color') || DEFAULT_COLOR;
        context.font = this.style.canvasFont;
        context.textBaseline = textBaseline as any;
        context.fillStyle = color;
        context.fillText(this.displayText, offsetLeft, offsetTop);
        // context.strokeStyle = 'rgba(255,0,0,.5)';
        // context.strokeRect(this.offsetLeft, this.offsetTop, this.offsetWidth, this.offsetHeight);
      }
    } else if (this.blockType === BlockType.inlineBlock || this.blockType === BlockType.block) {
      context.strokeStyle = '#00f';
      context.strokeRect(offsetLeft, offsetTop, offsetWidth, offsetHeight);
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
