import Line from './line';
import Element from './element';
import {NodeType} from './constants';

/**
 * 布局行管理
 */

export default class LineManger extends Array<Line> {
  element: Element;

  constructor(element: Element) {
    super();
    // 修复原型链丢失
    Object.setPrototypeOf(this, LineManger.prototype);
    this.element = element;
  }

  public lastInheritLine() {
    let lastLine = this[this.length - 1];
    if (lastLine) {
      let lastElement = lastLine.last;
      while (lastElement) {
        if (lastElement.lines.length) {
          lastElement = lastElement.lines[lastElement.lines.length - 1].last;
        } else {
          // @ts-ignore
          lastLine = lastElement.line;
          break;
        }
      }
    }
    return lastLine;
  }

  public lastLine() {
    return this[this.length - 1];
  }

  public newLine(width: number) {
    const line = new Line();
    if (width) {
      line.width = width;
    }

    let prev: Line | null = this.lastLine();

    if (!prev) {
      // 继承上一个父元素的float布局
      prev = this.element.line;
    }

    if (prev) {
      if (prev.length === 1 && prev.last.nodeName === '#breakholder') {
        // 只有一行的占位符 直接使用
        return prev;
      }
      if (prev.length === 0) {
        // 上一行没有内容的话 则 向上一行插入一个换行元素
        const br = new Element();
        br.nodeName = '#breakholder';
        br.nodeType = NodeType.ELEMENT_NODE;
        br.contentHeight = this.element.root ? this.element.root.textMetric.lineHeight : this.element.textMetric.lineHeight;
        br.line = prev;
        br.lineElement = this.element;
        prev.append(br);
        // return prev;
      }
      const {floats, normalHeight} = prev;
      // 上一行的overflow
      let idx = floats.left.slice().reverse().findIndex(i => i.offsetHeight > normalHeight);
      if (idx > -1) {
        const left = floats.left.slice(0, floats.left.length - idx);
        prev.holdLefts = Array.from(new Set([...prev.holdLefts, ...left]));
      }

      idx = floats.right.slice().reverse().findIndex(i => i.offsetHeight > normalHeight);
      if (idx > -1) {
        const right = floats.right.slice(0, floats.right.length - idx);
        prev.holdRights = Array.from(new Set([...prev.holdRights, ...right]));
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
      if (prev.overLeftHeight > 0 || prev.overRightHeight > 0) {
        let lastOverflowIndex = -1;
        prev.holdLefts.forEach((el, index) => {
          const {offsetHeight} = el;
          if (offsetHeight - normalHeight > 0) {
            lastOverflowIndex = index;
          }
        }, 0);

        // TODO 因为精度导致的float后元素多出空白行问题
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
    this.push(line);
    line.lines = this;
    return line;
  }

  public lastLineOrNewLine(width: number) {
    const line = this.lastLine();
    return line || this.newLine(width);
  }

  public get linesHeight() {
    return this.reduce((total, line) => {
      total += line.height;
      return total;
    }, 0)
  }
}