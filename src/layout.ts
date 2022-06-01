import {BlockType, NodeType, REG_PCT, REG_PX, styleKeywords, SupportElement, TextAlign} from './constants';
import ElementImage from './element-image';
import LineManger from './line-manger';
import Line from './line';
import Element from './element';

class Layout {

  /**
   * 裸文字宽度
   * 固定宽高
   * @param context
   */
  public layoutFixedSize(this: Layout & Element, context: CanvasRenderingContext2D) {
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
  public layoutInheritWidth(this: Layout & Element, context: CanvasRenderingContext2D) {
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
  public layoutPercentSize(this: Layout & Element, context: CanvasRenderingContext2D) {
    const blockType = this.blockType;
    if (blockType === BlockType.block || blockType === BlockType.inlineBlock) {
      const {width, height} = this.style;
      if (REG_PCT.test(width)) {
        // 百分比计算
        const parent = this.getNearBlock();
        if (parent) {
          // 父元素宽度计算百分比
          this.contentWidth = this.style.transformUnitToPx(width, parent.contentWidth);
        }
      }
      if (REG_PCT.test(height)) {
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
            const ratio = this.contentWidth / img.imageWidth;
            this.contentHeight = img.imageHeight * ratio;
          } else if (height) {
            const ratio = this.contentHeight / img.imageHeight
            this.contentWidth = img.imageWidth * ratio;
          }
        }
      } else {
        // 使用图片宽高
        this.contentWidth = img.imageWidth;
        this.contentHeight = img.imageHeight;
      }
    }

    this.children.forEach(el => {
      el.layoutPercentSize(context);
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
  public layoutLine(this: Layout & Element, context: CanvasRenderingContext2D) {
    const blockType = this.blockType;
    const isNoWrap = this.style.isNoWrap;

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
            element.lines = new LineManger(element);
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
                line = lastLine;
                return half;
              }
              // 重置shadow元素
              element.shadows = [];
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
              let relLine = relativeBlock.lines.lastLineOrNewLine(relativeBlock.contentWidth);
              element.lineElement = relativeBlock;
              element.line = relLine;
              if (relativeBlock.blockType === BlockType.inline) {
                const block = relativeBlock.parentNode;
                if (block) {
                  const reLine = block.lines.lastLineOrNewLine(block.contentWidth);
                  reLine.push(element);
                  element.line = reLine;
                } else {
                  // 没有父元素
                  throw new Error('定位元素无法找到父元素');
                  console.error('定位元素无法找到父元素', this);
                }
              } else {
                element.line = relLine
                relLine.push(element);
              }
            } else {
              if (isNoWrap) {
                line.push(element);
              } else {
                while (!line.append(element)) {
                  const lastLine = this.lines.lastLine();
                  const newLine = this.lines.newLine(line.width);
                  const height = Math.max(lastLine.overLeftHeight, lastLine.overRightHeight);
                  if (height) {
                    // float 填充位置
                    insertPlaceholder(height, newLine, element);
                    line = this.lines.newLine(line.width);
                    // console.log('强制换行4 overflow');
                  } else {
                    line = newLine;
                    // console.log('强制换行3');
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

  public layoutLinePosition(this: Layout & Element) {
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

      // @ts-ignore
      let target: Element = absolute.lineElement;
      const shadows: Element[] = target.shadows || [];

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

  public layout(this: Layout & Element, context: CanvasRenderingContext2D) {
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
    this.layoutPercentSize(context);

    /**
     * 计算文字布局
     */
    this.layoutLine(context);

    /**
     * 计算行内元素 坐标起点
     */
    this.layoutLinePosition();
  }
}

export default Layout;