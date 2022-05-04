import {BackgroundClip, BackgroundPosition, BackgroundSize, BlockType, BORDER_STYLE, GradientType, NodeType, REG_PCT, REG_PX, styleKeywords, SupportElement, TContinueDraw, TEXT_DECORATION_LINE, TEXT_DECORATION_STYLE, TextAlign} from './constants';
import Style, {IBackground, IBorder} from './style';
import Line from './line';
import LineManger from './line-manger';
import ElementImage from './element-image';
import {createLinearGradient, drawRepeatImage} from './util';

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

  public debug = false;

  // public blockType: BlockType;
  // public displayText: string;

  public updateCache() {
    // this.blockType = this._blockType;
    // this.displayText = this._displayText;
    this.style.updateCache();
  }

  public clone() {
    const e = new Element();
    Object.assign(e, this);
    e.shadow = this;
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
    const {canvasFont, lineHeight} = this.style;
    // TODO letter-spacing 支持
    context.font = canvasFont;
    const textMetrics = context.measureText(text);
    // let fontHeight = textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent;
    // let fontHeight = NaN;
    // if (isNaN(fontHeight)) {
    //   // 兼容不支持测量文字基线的canvas
    //   fontHeight = this.style.fontSize;
    // }
    return {
      width: textMetrics.width,
      lineHeight,
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
        const parent = this.getNearBlock();
        if (parent) {
          if (width) {
            if (REG_PX.test(width)) { // 固定尺寸 缩放
              const ratio = Math.abs(img.imageWidth - this.contentWidth) / img.imageWidth;
              this.contentHeight = img.imageHeight * ratio;
            } else if (REG_PCT.test(width)) { // 按比例缩放
              const ratio = this.contentWidth / img.imageWidth;
              this.contentHeight = img.imageHeight * ratio;
            }
          } else if (height) {
            if (REG_PX.test(height)) { // 固定尺寸 缩放
              const ratio = Math.abs(img.imageWidth - this.contentWidth) / img.imageWidth;
              this.contentWidth = img.contentWidth * ratio;
            } else if (REG_PCT.test(height)) { // 按比例缩放
              const ratio = this.contentHeight / img.imageHeight
              this.contentWidth = img.imageWidth * ratio;
            }
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

    // TODO 修复 嵌套 float元素 影响文字布局问题

    if (blockType === BlockType.inlineBlock || blockType === BlockType.block) {
      // 重置行
      this.lines = new LineManger(this);
      let line = this.lines.newLine(this.contentWidth);

      /**
       * 向指定行插入占位元素
       * @param height
       * @param line
       * @param element
       */
      const insertPlaceholder = (height: number, line: Line, element: Element) => {
        const e = new Element()
        e.nodeName = '#placholder';
        e.nodeValue = '';
        e.contentHeight = height;
        e.lineElement = element;
        e.line = line;
        line.push(e);
        return e;
      };

      /**
       * 向指定元素行插入空行 计算overflow
       * @param element
       */
      const insertEmptyLine = (element: Element) => {
        const line = element.lines.newLine(0);
        const e = new Element()
        e.nodeName = '#empty';
        e.nodeValue = '';
        e.lineElement = element;
        e.line = line;
        line.push(e);
        return e;
      };

      const recursion = (element: Element) => {
        if (element.nodeType === NodeType.COMMENT_NODE) {
          return
        }
        element.lineElement = this;
        element.line = line;
        const childBlockType = element.blockType;
        const {clear, isOverflow, isFloat} = element.style;
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

              const pushElement = (lineText: string, textWidth: number) => {
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
              }

              // TODO 单词组合不允许拆分换行
              // TODO 优化文字宽度不够自动换行逻辑
              while (text.length) {
                if (line.restWidth <= 0) {
                  if (line.length === 0) {
                    textMetrics = element.getTextMetrics(context, text);
                    pushElement(text, textMetrics.width);
                    // console.log('强制换行1')
                    break;
                  } else {
                    line = this.lines.newLine(line.width);
                    lineText = text;
                    // console.log('剩余宽度 继续拆分')
                  }
                } else if (lineText === '') {
                  if (line.length === 0) {
                    textMetrics = element.getTextMetrics(context, text);
                    // console.log('强制换行2', line.restWidth, line, text);
                    pushElement(text, textMetrics.width);
                    break;
                  } else {
                    line = this.lines.newLine(line.width);
                    lineText = text;
                    continue;
                  }
                }
                textMetrics = element.getTextMetrics(context, lineText);
                const textWidth = textMetrics.width;
                if (textWidth <= line.restWidth) {
                  pushElement(lineText, textWidth);
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
            line = this.lines.newLine(line.width);
            line.push(element);
            element.line = line;
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
                // TODO 元素闭合有问题？？？？？
                line = lastLine;
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
          // TODO clear 支持区分左右浮动清除

          if (childBlockType === BlockType.inlineBlock) {
            // 行元素继承float占位 但是坐标不重新计算
            element.line = null;
            let lastInheritLine = this.lines.lastInheritLine();
            if (lastInheritLine && (lastInheritLine.holdLefts.length || lastInheritLine.holdRights.length)) {
              if (clear) {
                // 向当前元素前添加占位元素 高度等于overflow的高度
                lastInheritLine.lines.newLine(0);
                lastInheritLine.lines.pop();
                const clearLine = this.lines.newLine(0);
                const lastOverflow = lastInheritLine.lines.lastLine();
                const height = Math.max(lastOverflow.overLeftHeight, lastOverflow.overRightHeight);
                insertPlaceholder(height, clearLine, this);
              } else {
                const newLine = this.lines.newLine(line.width);
                Object.assign(newLine, lastInheritLine);
                line = newLine;
              }
            }
          } else {
            let lastInheritLine = this.lines.lastInheritLine();
            if (lastInheritLine && (lastInheritLine.holdLefts.length || lastInheritLine.holdRights.length)) {
              if (clear) {
                // 向当前元素前添加占位元素 高度等于overflow的高度
                lastInheritLine.lines.newLine(0);
                lastInheritLine.lines.pop();
                const clearLine = this.lines.newLine(0);
                const lastOverflow = lastInheritLine.lines.lastLine();
                const height = Math.max(lastOverflow.overLeftHeight, lastOverflow.overRightHeight);
                insertPlaceholder(height, clearLine, this);
                element.line = null;
                line = clearLine;
              } else {
                // 块元素继承float 并且坐标重计算
                element.line = lastInheritLine;
              }
            }
          }

          // TODO img 标签优化
          element.layoutLine(context);

          // 强制闭合float元素
          if (childBlockType === BlockType.inlineBlock || isOverflow) {
            element.lines.newLine(line.width); // 计算子布局overflow高度
            element.lines.pop();
            const lastLine = element.lines.lastLine();

            // 强制闭合子元素浮动
            if (lastLine && (lastLine.overLeftHeight || lastLine.overRightHeight)) {
              const newLine = element.lines.newLine(line.width);
              // 空行插入占位元素 填充剩余高度
              const height = Math.max(lastLine.overLeftHeight, lastLine.overRightHeight);
              insertPlaceholder(height, newLine, element);
            }
          }

          if (childBlockType === BlockType.inlineBlock) {
            // 计算真正的inline-block占用宽度
            if (element.nodeName === SupportElement.img) {

            } else {
              // TODO 宽度可能不准确 因为如果是手写是百分比宽度的话 则会出现异常
              if (!element.style.width) {
                element.contentWidth = Math.max(...element.lines.map(i => i.realWidth));
              }

              // TODO 高度可能不准确 因为如果是手写是百分比高度的话 则会出现异常
              if (!element.style.height) {
                element.contentHeight = element.lines.linesHeight;
              }
            }

            if (element.style.isAbsolute) {
              // TODO 绝对定位 如果没有指明位置的话 则使用当前文档位置
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
                  if (line.length === 0) {
                    // console.log('强制换行3', line);
                    line.push(element);
                    break;
                  }
                }
                element.line = line;
              }
            }
          } else if (childBlockType === BlockType.block) {
            // 计算出最后的float overflow
            insertEmptyLine(element);
            if (line.length) {
              line = this.lines.newLine(line.width);
            }
            line.push(element);
            element.line = line;
            // TODO 高度可能不准确 因为如果是手写是百分比高度的话 则会出现异常
            if (element.nodeName === SupportElement.img) {

            } else {
              if (!element.style.height) {
                element.contentHeight = element.lines.linesHeight;
              }
            }
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
    }

    // TODO 其他布局支持
    const lastLine = this.lines.lastLine();
    if (lastLine && lastLine.length === 0) {
      this.lines.pop();
    }
  }

  public layoutLinePosition() {
    const {margin, border, padding, textAlign} = this.style;
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
      const {textFlows, floats, absolutes: lineAbsolutes, height} = line;
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
          if (textAlign === TextAlign.center) {
            offset = restWidth / 2;
          } else if (textAlign === TextAlign.right) {
            offset = restWidth;
          }
        }

        // 文字和行内块 不一样高时 需要向文字添加高度
        // TODO 支持 vertical-align
        const textTopHolder = height - el.offsetHeight;
        // const textTopHolder = 0;
        el.left = floatLeft + left + offset;
        el.top = top + textTopHolder;
        left += el.offsetWidth;
      })
      line.forEach(el => {
        el.layoutLinePosition();

        // TODO margin 负值布局错误
        if (el.blockType === BlockType.block) {
          // block前面有float元素偏移问题
          el.left -= line.holdLeftWidth;

          // margin: 0 auto; 移动盒子位置
          const originMargin = el.style.getOriginRoundStyle(styleKeywords.margin);
          // @ts-ignore
          if (originMargin.left === styleKeywords.auto && originMargin.right === styleKeywords.auto) {
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
    const {margin, border, padding, fontSize, lineHeight} = this.style;
    const {contentWidth, contentHeight, offsetLeft, offsetTop} = this;
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

      // TODO 修改repeat函数 支持渐变
      if (background.gradient) {
        let target: CanvasGradient;
        switch (background.gradient.type) {
          case GradientType.linearGradient:
            target = createLinearGradient(
              context,
              offsetTop + margin.left, offsetLeft + margin.top,
              clipBox.width, clipBox.height,
              background.gradient,
            );
            break;
        }
      } else if (img && img.source) {
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

    const {border, radius, margin, padding} = this.style;
    const {offsetLeft, offsetTop, contentHeight, contentWidth} = this;

    const {top, right, bottom, left} = border;
    const {topLeft, topRight, bottomRight, bottomLeft, maxWidth, maxHeight} = radius;

    // 排除边框位置
    const x = offsetLeft + margin.left;
    const y = offsetTop + margin.top;

    const width = contentWidth + padding.left + padding.right + border.left.width + border.right.width;
    const height = contentHeight + padding.top + padding.bottom + border.top.width + border.bottom.width;

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

    const setBorderStyle = (border: IBorder) => {
      // TODO 其他类型支持
      switch (border.style) {
        case BORDER_STYLE.solid:
          ctx.setLineDash([]);
          break;
        case BORDER_STYLE.dashed:
          ctx.setLineDash([border.width * 1.5, border.width]);
          break;
      }
    }

    if (hasRadius) {
      const oneDegree = Math.PI / 180;
      if (sameWidth && sameStyle && sameColor && isCycle) { // 样式完全一样的 圆形\椭圆形 一次画完
        // 外圆选区
        if (typeof continueDraw === 'function') {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI);
          ctx.clip();
          continueDraw(ctx);
          ctx.restore();
        }

        if (hasBorder) {
          ctx.save();
          ctx.beginPath();
          // ctx.translate(top.width / 2, top.width / 2);
          ctx.lineWidth = top.width;
          ctx.strokeStyle = top.color;
          setBorderStyle(top);
          ctx.ellipse(
            width / 2, height / 2,
            width / 2 - top.width / 2, height / 2 - top.width / 2,
            0,
            0, 2 * Math.PI,
          );
          ctx.stroke();
          ctx.restore();
        }
      } else { // 样式不一样的 圆角矩形\圆形\椭圆形
        // 外圆选区
        {
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (topLeft.width && topLeft.height) { // 圆角
            ctx.ellipse(
              topLeft.width, topLeft.height,
              topLeft.width, topLeft.height, 0,
              Math.PI, oneDegree * -90,
            );
          } else {
            ctx.moveTo(0, 0);
          }

          if (topRight.width && topRight.height) {
            ctx.ellipse(
              width - topRight.width, topRight.height,
              topRight.width, topRight.height, 0,
              oneDegree * -90, 0,
            );
          } else {
            // ctx.lineTo()
            ctx.lineTo(width, 0);
          }

          if (bottomRight.width && bottomRight.height) {
            ctx.ellipse(
              width - bottomRight.width,
              height - bottomRight.height,
              bottomRight.width, bottomRight.height, 0,
              0, oneDegree * 90,
            );
          } else {
            ctx.lineTo(width, height);
          }

          if (bottomLeft.width && bottomLeft.height) {
            ctx.ellipse(
              bottomLeft.width,
              height - bottomLeft.height,
              bottomLeft.width, bottomLeft.height, 0,
              oneDegree * 90, Math.PI,
            );
          } else {
            ctx.lineTo(0, height);
          }
          ctx.closePath();
          // ctx.stroke();
          ctx.clip();
        }

        if (hasBorder) {
          // 边框
          // TODO 极限情况下 选区可能交叉 产生溢出
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
              ctx.lineWidth = 1;
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
              ctx.clip();
              // ctx.stroke();

              ctx.beginPath();
              if (topLeft.width && topLeft.height) { // 圆角
                ctx.ellipse(
                  topLeft.width, topLeft.height,
                  topLeft.width - top.width / 2, topLeft.height - top.width / 2, 0,
                  Math.PI, oneDegree * -90,
                );

              } else {
                ctx.moveTo(0, 0);
              }

              if (topRight.width && topRight.height) {
                ctx.ellipse(
                  width - topRight.width, topRight.height,
                  topRight.width - top.width / 2, topRight.height - top.width / 2, 0,
                  oneDegree * -90, 0,
                );
              } else {
                // ctx.lineTo()
                ctx.lineTo(width, 0);
              }

              ctx.strokeStyle = top.color;
              ctx.lineWidth = top.width * scale;
              setBorderStyle(top);
              ctx.stroke();

              // ctx.save();
              // ctx.beginPath();
              // const lineWidth = Math.max(left.width, right.width, top.width);
              // ctx.translate(0, lineWidth);
              // ctx.strokeStyle = top.color;
              // ctx.lineWidth = lineWidth * 3;
              // setBorderStyle(top);
              // ctx.moveTo(0, 0);
              // ctx.lineTo(width, 0);
              // ctx.stroke();
              // ctx.restore();

              ctx.restore();
            }
            // 右边
            {
              ctx.save();
              ctx.lineWidth = 1;
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
              ctx.clip();

              ctx.beginPath();
              if (topRight.width && topRight.height) {
                ctx.ellipse(
                  width - topRight.width, topRight.height,
                  topRight.width - right.width / 2, topRight.height - right.width / 2, 0,
                  oneDegree * -90, 0,
                );
              } else {
                // ctx.lineTo()
                ctx.lineTo(width, 0);
              }

              if (bottomRight.width && bottomRight.height) {
                ctx.ellipse(
                  width - bottomRight.width, height - bottomRight.height,
                  bottomRight.width - right.width / 2, bottomRight.height - right.width / 2, 0,
                  0, oneDegree * 90,
                );
              } else {
                ctx.lineTo(width, height);
              }

              ctx.strokeStyle = right.color;
              ctx.lineWidth = right.width * scale;
              setBorderStyle(right);
              ctx.stroke();

              // ctx.save();
              // ctx.beginPath();
              // const lineWidth = Math.max(top.width, right.width, bottom.width);
              // ctx.translate(-lineWidth, 0);
              // ctx.strokeStyle = right.color;
              // ctx.lineWidth = lineWidth * 3;
              // setBorderStyle(right);
              // ctx.moveTo(width, 0);
              // ctx.lineTo(width, height);
              // ctx.stroke();
              // ctx.restore();

              ctx.restore();
            }
            // 下边
            {
              ctx.save();
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(width, height);
              // ctx.lineTo(width, height);
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
              ctx.clip();

              ctx.beginPath();
              if (bottomRight.width && bottomRight.height) {
                ctx.ellipse(
                  width - bottomRight.width, height - bottomRight.height,
                  bottomRight.width - bottom.width / 2, bottomRight.height - bottom.width / 2, 0,
                  0, oneDegree * 90,
                );
              } else {
                ctx.lineTo(width, height);
              }

              if (bottomLeft.width && bottomLeft.height) {
                ctx.ellipse(
                  bottomLeft.width, height - bottomLeft.height,
                  bottomLeft.width - bottom.width / 2, bottomLeft.height - bottom.width / 2, 0,
                  oneDegree * 90, Math.PI,
                );
              } else {
                ctx.lineTo(0, height);
              }

              ctx.strokeStyle = bottom.color;
              ctx.lineWidth = bottom.width * scale;
              setBorderStyle(bottom);
              ctx.stroke();

              // ctx.save();
              // ctx.beginPath();
              // const lineWidth = Math.max(left.width, right.width, bottom.width);
              // ctx.translate(0, -lineWidth);
              // ctx.strokeStyle = bottom.color;
              // ctx.lineWidth = lineWidth * 3;
              // setBorderStyle(bottom);
              // ctx.moveTo(0, height);
              // ctx.lineTo(width, height);
              // ctx.stroke();
              // ctx.restore();

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
              ctx.clip();

              ctx.beginPath();
              if (bottomLeft.width && bottomLeft.height) {
                ctx.ellipse(
                  bottomLeft.width, height - bottomLeft.height,
                  bottomLeft.width - left.width / 2, bottomLeft.height - left.width / 2, 0,
                  oneDegree * 90, Math.PI,
                );
              } else {
                ctx.lineTo(0, height);
              }

              if (topLeft.width && topLeft.height) { // 圆角
                ctx.ellipse(
                  topLeft.width, topLeft.height,
                  topLeft.width - left.width / 2, topLeft.height - left.width / 2, 0,
                  Math.PI, oneDegree * -90,
                );
              } else {
                ctx.lineTo(0, 0);
              }
              ctx.strokeStyle = left.color;
              ctx.lineWidth = left.width * scale;
              setBorderStyle(left);
              ctx.stroke();

              // ctx.save();
              // ctx.beginPath();
              // const lineWidth = Math.max(top.width, left.width, bottom.width);
              // ctx.translate(lineWidth, 0);
              // ctx.strokeStyle = left.color;
              // ctx.lineWidth = lineWidth * 3;
              // setBorderStyle(left);
              // ctx.moveTo(0, 0);
              // ctx.lineTo(0, height);
              // ctx.stroke();
              // ctx.restore();

              ctx.restore();
            }
          }

          // 内圆选区
          {
            ctx.save();
            ctx.beginPath();
            if (topLeft.width - left.width > 0 && topLeft.height - top.width > 0) { // 圆角
              ctx.ellipse(
                topLeft.width, topLeft.height,
                topLeft.width - left.width, topLeft.height - top.width, 0,
                Math.PI, oneDegree * -90,
              );
            } else {
              ctx.moveTo(left.width, top.width);
            }

            if (topRight.width - right.width > 0 && topRight.height - top.width > 0) {
              ctx.ellipse(
                width - topRight.width, topRight.height,
                topRight.width - right.width, topRight.height - top.width, 0,
                oneDegree * -90, 0,
              );
            } else {
              ctx.lineTo(width - right.width, top.width);
            }

            if (bottomRight.width - right.width > 0 && bottomRight.height - bottom.width > 0) {
              ctx.ellipse(
                width - bottomRight.width,
                height - bottomRight.height,
                bottomRight.width - right.width, bottomRight.height - bottom.width, 0,
                0, oneDegree * 90,
              );
            } else {
              ctx.lineTo(width - right.width, height - bottom.width);
            }

            if (bottomLeft.width - left.width > 0 && bottomLeft.height - bottom.width > 0) {
              ctx.ellipse(
                bottomLeft.width,
                height - bottomLeft.height,
                bottomLeft.width - left.width, bottomLeft.height - bottom.width, 0,
                oneDegree * 90, Math.PI,
              );
            } else {
              ctx.lineTo(left.width, height - bottom.width);
            }
            ctx.closePath();

            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.restore();
          }
        }

        if (typeof continueDraw === 'function') {
          ctx.save();
          // TODO 小程序 不支持该模式 会导致边框丢失
          //  可以通过 background-clip: padding-box 解决
          ctx.globalCompositeOperation = 'destination-over';
          continueDraw(ctx);
          ctx.restore();
        }
      }
    } else {
      if (typeof continueDraw === 'function') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.clip();
        continueDraw(ctx);
        ctx.restore();
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
            ctx.clip();

            ctx.save();
            ctx.beginPath();
            ctx.translate(0, top.width / 2);
            ctx.strokeStyle = top.color;
            ctx.lineWidth = top.width;
            setBorderStyle(top);
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
            setBorderStyle(right);
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
            setBorderStyle(bottom);
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
            setBorderStyle(left);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, height);
            ctx.stroke();
            ctx.restore();

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
  public drawText(context: CanvasRenderingContext2D) {
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
  public drawTextDecoration(context: CanvasRenderingContext2D) {
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
  public draw(context: CanvasRenderingContext2D) {
    const {background: backgroundList} = this.style;
    const {
      offsetLeft, offsetTop,
      contentWidth, contentHeight,
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

    if (this.nodeName === SupportElement.img) {
      const img: ElementImage = this as any;
      if (img.source) {
        context.drawImage(img.source, offsetLeft, offsetTop, contentWidth, contentHeight);
      }
    }

    if (this.shadow && this.shadow.shadows.indexOf(this) > 0) {
      return;
    }
    this.lines.forEach(line => {
      line.textFlows.forEach(el => el.draw(context));
    })
    this.lines.forEach(line => {
      line.floats.all.forEach(el => el.draw(context));
    })
    // TODO z-index 支持
    this.lines.forEach(line => {
      line.absolutes.forEach(el => el.draw(context));
    })
  }
}
