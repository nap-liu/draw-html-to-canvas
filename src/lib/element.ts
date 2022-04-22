import {BlockType, DEFAULT_COLOR, DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT, NodeType, SupportElement} from './constants';
import Style from './style';
import Line from './line';

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

  public lines: Line[] = [];
  public line: Element | null = null;

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

  public getTextMetrics(context: CanvasRenderingContext2D, text: string) {
    // TODO letter-spacing 支持
    context.font = this.style.canvasFont;
    const textMetrics = context.measureText(text);
    const fontHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
    let lineHeight: string | number = this.style.getInheritStyle('line-height') || DEFAULT_LINE_HEIGHT;
    if (/px$/.test(lineHeight)) {
      lineHeight = parseFloat(lineHeight);
    } else if (/^\d+(.\d+)?$/.test(lineHeight)) {
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
    } else if (blockType === BlockType.block || blockType === BlockType.inlineBlock) {
      const {width, height} = this.style;
      if (/px$/.test(width)) {
        // 固定尺寸
        this.contentWidth = this.style.transformUnitToPx(width);
      }

      if (/px$/.test(height)) {
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
    const {width} = this.style;
    if (!width) {
      if (blockType === BlockType.block || blockType === BlockType.inlineBlock) {
        const parent = this.getNearBlock();
        if (parent) {
          this.contentWidth = parent.contentWidth;
        }

        if (blockType === BlockType.inlineBlock) {
          // inline-block 使用内容宽度
          // 如果内容超出父元素 则使用父元素宽度
          // this.contentWidth = Math.min(
          //   this.getMaxChildWidth(),
          //   this.contentWidth,
          // );
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
      if (/%$/.test(width)) {
        // 百分比计算
        const parent = this.getNearBlock();
        if (parent) {
          // 父元素宽度计算百分比
          this.contentWidth = this.style.transformUnitToPx(width, parent.contentWidth);
        }
      }
      if (/%$/.test(width)) {
        // 百分比计算
        const parent = this.getNearBlock();
        if (parent && parent.contentHeight) {
          // 父元素高度计算百分比
          this.contentHeight = this.style.transformUnitToPx(width, parent.contentHeight);
        }
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
  public layoutInlineBlockWidth(context: CanvasRenderingContext2D) {
    const blockType = this.blockType;
    const isNoWrap = this.style.isNoWrap;
    // const lineHeight = this.style.lineHeight;

    if (blockType === BlockType.inlineBlock || blockType === BlockType.block) {
      // 重置行
      this.lines = [];
      let line = this.newLine(this.contentWidth);
      const recursion = (element: Element) => {
        element.line = this;
        const childBlockType = element.blockType;
        if (element.nodeType === NodeType.TEXT_NODE) {
          let textMetrics = element.getTextMetrics(context, element.displayText)
          // 文字元素 计算文字宽度 无嵌套情况 无需递归
          if (isNoWrap) {
            // 强制不换行
            line.push(element);
          } else {
            // TODO 文字使用float元素换行剩余的位置
            if (!line.append(element)) {
              // 拆分元素换行
              let text = element.displayText;
              let lineText = text;
              // 清空换行分割的临时元素
              element.shadows = [];
              while (text.length) {
                textMetrics = element.getTextMetrics(context, lineText);
                const textWidth = textMetrics.width;
                if (textWidth <= line.restWidth) {
                  if (lineText === '') {
                    line = this.newLine(line.width);
                    lineText = text;
                    continue;
                  }
                  const el = element.clone();
                  el.nodeValue = lineText;
                  el.contentWidth = textWidth;
                  el.contentHeight = textMetrics.lineHeight;
                  line.push(el);
                  element.shadows.push(el);
                  el.shadow = element;
                  text = text.slice(lineText.length);
                  lineText = text;
                } else {
                  lineText = lineText.slice(0, -1);
                }
              }
              element.contentHeight = element.shadows.length * textMetrics.lineHeight;
            } else {
              element.contentHeight = textMetrics.lineHeight;
            }
          }
        } else if (element.nodeType === NodeType.ELEMENT_NODE && childBlockType === BlockType.inline) {
          if (element.nodeName === SupportElement.br || element.nodeName === SupportElement.hr) {
            // br\hr 元素 强制换行
            const textMetrics = element.getTextMetrics(context, '');
            element.contentHeight = textMetrics.lineHeight;
            if (line.restWidth === 0) {
              line = this.newLine(line.width);
              line.push(element);
              element.contentWidth = line.restWidth;
            } else {
              line.push(element);
              element.contentWidth = line.restWidth;
            }
            // if (line.length) {
            //   line = this.newLine(line.width);
            // }
            // line.push(element);
            // element.contentWidth = line.width;
            // element.contentHeight = lineHeight;
            // line = this.newLine(line.width);
          } else if (!line.append(element)) {
            // inline元素
            line = this.newLine(line.width);
            line.push(element);
          }

          // const idx = this.lines.length;
          // 递归计算子节点
          element.children.forEach(recursion);
          // 递归的子节点 放到inline元素下
          // element.lines = this.lines.slice(idx);
          // 剩余的节点删除
          // this.lines = this.lines.slice(0, idx);
        } else {
          // inline-block\block嵌套 递归布局
          element.layoutInlineBlockWidth(context);

          if (childBlockType === BlockType.inlineBlock) {
            // 计算真正的inline-block占用宽度

            // TODO 宽度可能不准确 因为如果是手写是百分比宽度的话 则会出现异常
            if (!element.style.width) {
              element.contentWidth = Math.max(...element.lines.map(i => i.usedWidth));
            }

            // TODO 高度可能不准确 因为如果是手写是百分比高度的话 则会出现异常
            if (!element.style.height) {
              element.contentHeight = element.linesHeight;
            }

            if (element.style.isAbsolute) {
              const relativeBlock = element.getNearRelativeBlock() || this.root;
              const relLine = relativeBlock.lastLineOrNewLine(relativeBlock.contentWidth);
              relLine.push(element);
            } else {
              if (!line.append(element)) {
                line = this.newLine(line.width);
                line.push(element);
              }
            }
          } else if (childBlockType === BlockType.block) {
            if (line.length) {
              line = this.newLine(line.width);
            }
            line.push(element);
            line = this.newLine(line.width);
            // TODO 高度可能不准确 因为如果是手写是百分比高度的话 则会出现异常
            if (!element.style.height) {
              element.contentHeight = element.linesHeight;
            }
          }
        }
      }
      this.children.forEach(recursion);

      // TODO 百分比高度会有问题
      if (!this.style.height) {
        this.contentHeight = this.linesHeight;
      }
    } else {
      this.children.forEach(e => e.layoutInlineBlockWidth(context));
    }
    return;
  }

  public lastLine() {
    return this.lines[this.lines.length - 1];
  }

  public newLine(width: number) {
    const line = new Line();
    if (width) {
      line.width = width;
    }

    const prev = this.lastLine();

    if (prev) {
      const {floats, normalHeight} = prev;
      // 上一行的overflow
      let idx = floats.left.slice().reverse().findIndex(i => i.offsetHeight > normalHeight);
      if (idx > -1) {
        const left = floats.left.slice(0, floats.left.length - idx);
        prev.holdLefts.push(...left);
      }

      idx = floats.right.slice().reverse().findIndex(i => i.offsetHeight > normalHeight);
      if (idx > -1) {
        const right = floats.right.slice(0, floats.right.length - idx);
        prev.holdRights.push(...right);
      }

      let maxOverflow = Math.max(...prev.holdLefts.map(i => i.offsetHeight));
      if (maxOverflow > 0) {
        prev.overLeftHeight = maxOverflow - normalHeight;
      }

      maxOverflow = 0;
      maxOverflow = Math.max(...prev.holdRights.map(i => i.offsetHeight));
      if (maxOverflow > 0) {
        prev.overRightHeight = maxOverflow - normalHeight;
      }

      // 上一行有overflow元素
      if (prev.overLeftHeight || prev.overRightHeight) {
        let lastOverflowIndex = -1;
        prev.holdLefts.forEach((el, index) => {
          const {offsetHeight} = el;
          if (offsetHeight - normalHeight > 0) {
            lastOverflowIndex = index;
          }
        }, 0);

        // 继承上一行的overflow元素 和 元素宽度
        if (lastOverflowIndex !== -1) {
          // 继承左浮动元素
          line.holdLefts = prev.holdLefts.slice(0, lastOverflowIndex + 1).map(i => {
            const clone = i.clone();
            line.holdLeftWidth += i.offsetWidth;
            clone.contentHeight -= normalHeight;
            return clone;
          });
        }

        lastOverflowIndex = -1;
        // 继承上一行的float overflow元素宽度
        prev.holdRights.forEach((el, index) => {
          const {offsetHeight} = el;
          if (offsetHeight - normalHeight > 0) {
            lastOverflowIndex = index;
          }
        });

        // 继承上一行的overflow元素
        if (lastOverflowIndex !== -1) {
          // 继承右浮动元素
          line.holdRights = prev.holdRights.slice(0, lastOverflowIndex + 1).map(i => {
            const clone = i.clone();
            line.holdRightWidth += i.offsetWidth;
            clone.contentHeight -= normalHeight;
            return clone;
          });
        }
      }
    }
    this.lines.push(line);
    return line;
  }

  public lastLineOrNewLine(width: number) {
    const line = this.lastLine();
    return line || this.newLine(width);
  }

  public get linesHeight() {
    return this.lines.reduce((total, line) => {
      total += line.height;
      return total;
    }, 0)
  }

  public layoutLinePosition() {
    const {margin, border, padding} = this.style;
    const blockType = this.blockType;
    let offsetTop = 0;

    // if (this.prevNode) {
    //   offsetTop = this.prevNode.offsetHeight;
    // }

    /**
     * 每一行元素的left、top值
     */
    let top = this.top + offsetTop;

    const absolutes: Element[] = [];
    this.lines.forEach(line => {
      let left = this.left + line.holdLeftWidth;
      const {textFlows, floats, absolutes: lineAbsolutes} = line;
      let floatLeft = 0;
      let floatRight = 0;
      floats.left.forEach(float => {
        float.top = top;
        float.left = left + floatLeft;
        floatLeft += float.offsetWidth;
      })
      floats.right.forEach(float => {
        float.top = top;
        floatRight += float.offsetWidth;
        float.left = line.width - floatRight;
      })
      textFlows.forEach(el => {
        el.left = floatLeft + left;
        el.top = top;
        left += el.offsetWidth;
      })
      line.forEach(el => {
        el.layoutLinePosition();
      });
      top += line.height;
      absolutes.push(...lineAbsolutes);
    });

    absolutes.forEach(absolute => {
      const absoluteTop = absolute.style.get('top');
      const absoluteRight = absolute.style.get('right');
      const absoluteBottom = absolute.style.get('bottom');
      const absoluteLeft = absolute.style.get('left');

      if (absoluteLeft && absoluteRight) {
        // 同时有左右
        const l = absolute.style.transformUnitToPx(absoluteLeft);
        absolute.left = this.left + l;
        absolute.contentWidth = this.contentWidth - l - absolute.style.transformUnitToPx(absoluteRight);
      } else if (absoluteLeft) {
        absolute.left = this.left + absolute.style.transformUnitToPx(absoluteLeft)
      } else if (absoluteRight) {
        absolute.left = (this.left + this.contentWidth) - absolute.offsetWidth - absolute.style.transformUnitToPx(absoluteRight)
      }

      if (absoluteTop && absoluteBottom) {
        const t = absolute.style.transformUnitToPx(absoluteTop);
        absolute.top = this.top + t
        absolute.contentHeight = this.contentHeight - t - absolute.style.transformUnitToPx(absoluteBottom);
      } else if (absoluteTop) {
        absolute.top = this.top + absolute.style.transformUnitToPx(absoluteTop);
      } else if (absoluteBottom) {
        absolute.top = (this.top + this.contentHeight) - absolute.offsetHeight - absolute.style.transformUnitToPx(absoluteBottom);
        // absolute.contentHeight = (this.top + this.contentHeight) - absolute.offsetHeight - absolute.style.transformUnitToPx(absoluteBottom);
      }

      absolute.layoutLinePosition();
    })
  }

  public draw(context: CanvasRenderingContext2D) {
    if (this.nodeType === NodeType.TEXT_NODE) {
      const {displayText} = this;
      if (displayText) {
        const textBaseline = this.style.get('vertical-align') || 'top';
        const color = this.style.getInheritStyle('color') || DEFAULT_COLOR;
        context.font = this.style.canvasFont;
        context.textBaseline = textBaseline as any;
        context.fillStyle = color;
        // const offset = (lineHeight - fontSize) / 2;
        const offset = 0;
        context.fillText(this.displayText, this.left, this.top + offset);
        context.strokeStyle = '#f00';
        context.strokeRect(this.left, this.top, this.offsetWidth, this.offsetHeight);

        // const background = this.style.background

      }
    } else if (this.blockType === BlockType.inlineBlock || this.blockType === BlockType.block) {
      context.strokeStyle = '#00f';
      context.strokeRect(this.left, this.top, this.offsetWidth, this.offsetHeight);
    }
    this.lines.forEach(line => {
      line.forEach(el => {
        el.draw(context);
      })
      // console.log('--------')
    })
  }

  public layout(context: CanvasRenderingContext2D) {
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
     * 计算文字高度
     * 从 block、inline-block 元素开始
     *  1、行内元素
     *    1、inline\inline-block元素按顺序排列
     *    2、计算剩余宽度 元素宽度 - 浮动元素宽度 = 行内元素可用宽度
     *    3、行内元素高度等于 向上舍入(文字宽度 / 行内元素可用宽度) * 行高
     *  2、浮动元素、定位元素
     *    1、递归计算
     */
    this.layoutInlineBlockWidth(context);

    /**
     * 计算行内元素 坐标起点
     */
    this.layoutLinePosition();
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
      // inline 元素宽度跟随父级宽度
      return this.contentWidth + border.left.width + border.right.width + padding.left + padding.right
      // return 0;
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
      // inline 元素宽度跟随父级宽度
      return this.contentHeight + border.top.width + border.bottom.width + padding.top + padding.bottom
      // return 0;
    }
    return 0;
  };

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
}
