import Element from './element';
import {NodeType} from './constants';

export default class Line extends Array<Element> {
  // 可用总宽度
  width = 0;

  // 当前行左浮动overflow的元素
  holdLefts: Element[] = [];
  // 上面行左浮动的占用总宽度
  holdLeftWidth = 0;
  // 当前行overflow的高度
  overLeftHeight = 0;
  // 当前行右浮动overflow的元素
  holdRights: Element[] = [];
  // 上面行右浮动占用的总宽度
  holdRightWidth = 0;
  // 当前行右浮动overflow的高度
  overRightHeight = 0;

  append(element: Element) {
    if (this.restWidth >= element.offsetWidth) {
      this.push(element);
      return true;
    }
    return false;
  }

  push(...elements: Element[]) {
    elements = elements.filter(i => {
      if (i.nodeType === NodeType.TEXT_NODE) {
        return i.displayText;
      }
      return true;
    })
    return super.push(...elements);
  }

  get first() {
    return this[0];
  }

  get last() {
    return this[this.length - 1];
  }

  /**
   * 已经使用的宽度
   */
  get usedWidth() {
    return this.flows.reduce((total, element) => {
      total += element.offsetWidth;
      return total;
    }, 0);
  }

  /**
   * 剩余的宽度
   */
  get restWidth() {
    return this.width - this.holdLeftWidth - this.holdRightWidth - this.usedWidth;
  }

  /**
   * 浮动元素列表
   */
  get floats() {
    const left: Element[] = [];
    const right: Element[] = [];
    this.forEach(i => {
      const float = i.style.get('float');
      if (float === 'left') {
        left.push(i);
      } else if (float === 'right') {
        right.push(i);
      }
    })
    return {
      left,
      right,
      all: [...left, ...right],
    }
  }

  /**
   * 非绝对定位 元素列表
   */
  get flows() {
    return this.filter(i => !i.style.isAbsolute);
  }

  /**
   * 行内元素分类
   */
  get absolutes() {
    const absolute: Element[] = [];
    this.forEach(i => {
      if (i.style.isAbsolute) {
        absolute.push(i);
      }
    })
    return absolute;
  }

  /**
   * 非绝对定位 非浮动元素
   */
  get textFlows() {
    return this.filter(i => !i.style.isFloat && !i.style.isAbsolute);
  }

  /**
   * 正常布局下的行高度
   * 排除 绝对定位\float元素 后其他元素的最大高度
   */
  get normalHeight() {
    const heights = this.filter(i => !i.style.isFloat && !i.style.isAbsolute).map(i => i.offsetHeight);
    if (heights.length === 0) {
      return 0;
    }
    return Math.max(...heights);
  }

  /**
   * 浮动元素的高度
   */
  get floatHeight() {
    const heights = this.floats.all.map(i => i.offsetHeight);
    if (heights.length === 0) {
      return 0;
    }
    return Math.max(...heights);
  }

  /**
   * 行内最大高度
   * 不包含绝对定位元素的高度 不包含 浮动元素高度
   */
  get height() {
    return this.normalHeight;
  }

  /**
   * 内容元素宽度 + float占据宽度综合 不包含绝对定位元素宽度
   * this.useWidth + floatWidth
   */
  get realWidth() {
    return this.usedWidth + this.holdLeftWidth + this.holdRightWidth;
  }
}