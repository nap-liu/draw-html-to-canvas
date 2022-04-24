import Element from './element';
import {DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT, NodeType} from './constants';

interface IRound<T = any> {
  top: T;
  right: T;
  bottom: T;
  left: T;

  [x: string]: T;
}

interface IBorder {
  width: number;
  style: string;
  color: string;
}

/**
 * 样式处理
 */
export default class Style {
  private style: { [x: string]: string } = {};
  private styleIndex: { [x: string]: number } = {};
  private index = 0;
  private element: Element;

  public constructor(element: Element) {
    this.element = element;
  }

  public getInheritStyle(style: string) {
    const {element, value} = this.getInheritNode(style);
    if (element) {
      return value;
    }
    return null;
  }

  public getInheritNode(style: string) {
    let element: Element | null = this.element;
    while (element) {
      const value = element.style.get(style);
      if (value && value !== 'inherit') {
        return {element, value};
      }
      element = element.parentNode;
    }
    return {element: null, value: ''};
  }

  /**
   * 获取 简写 和 四个方向的样式属性值
   * 处理书写优先级
   * @param style
   */
  private getRoundStyle(style: string) {
    const all = this.style[style];
    const allIndex = this.styleIndex[style];
    let list: any = [];
    let allResult: IRound = {} as IRound;
    const dir = ['top', 'right', 'bottom', 'left'];
    if (all) {
      list = all.split(/\s+/g).filter(i => i);
      if (list.length === 1) {
        // all dir
        allResult = dir.reduce<any>((map, key) => {
          map[key] = list[0];
          return map;
        }, {});
      } else if (list.length === 2) {
        // top/bottom left/right
        allResult.top = allResult.bottom = list[0];
        allResult.left = allResult.right = list[1];
      } else if (list.length === 3) {
        // top left/right bottom
        allResult.top = list[0];
        allResult.left = allResult.right = list[1];
        allResult.bottom = list[2];
      } else if (list.length > 3) {
        // top right bottom left
        allResult.top = list[0];
        allResult.right = list[1];
        allResult.left = list[2];
        allResult.bottom = list[3];
      }
    }
    const result: IRound<string | number> = dir.reduce<any>((map, key) => {
      const fullKey = style + '-' + key
      const idx = this.styleIndex[fullKey];
      // @ts-ignore
      if (idx) {
        if (allIndex > idx) {
          map[key] = allResult[key];
        } else {
          map[key] = this.style[fullKey];
        }
      } else {
        map[key] = allResult[key];
      }
      return map;
    }, {});

    dir.forEach((key) => {
      result[key] = this.transformUnitToPx(result[key] as string);
    })

    return result as IRound<number>;
  }

  /**
   * 获取样式
   * @param key
   */
  public get(key: string) {
    return this.style[key];
  }

  /**
   * 获取属性的数字类型
   * @param key
   */
  getNumber(key: string) {
    return this.transformUnitToPx(this.get(key));
  }

  /**
   * 更新样式
   * @param key
   * @param value
   */
  public set(key: string, value: any) {
    this.style[key] = value;
    this.styleIndex[key] = ++this.index;
    return this;
  }

  /**
   * 单位值转像素
   * px 直接返回
   * % 按照父元素宽度计算
   * em 按照父元素font-size计算
   * rem 按照根元素font-size计算
   * @param unit 100px|100%|1rem|1em
   * @param base 单位换算基数
   */
  public transformUnitToPx(unit: string, base?: number) {
    if (!unit || unit === '0') {
      return 0;
    }
    if (/px$/.test(unit)) {
      return parseInt(unit);
    }
    if (!base) {
      throw new Error(`missing unit [${unit}]`);
    }
    if (/%$/.test(unit)) {
      return base * parseInt(unit) / 100;
    } else if (/rem$/.test(unit)) {
      return base * parseInt(unit);
    } else if (/em$/.test(unit)) {
      return base * parseInt(unit);
    } else {
      return parseInt(unit);
    }
  }

  public get canvasFont() {
    const fontStyle = this.getInheritStyle('font-style');
    const fontVariant = this.getInheritStyle('font-variant');
    const fontWeight = this.getInheritStyle('font-weight');
    const fontStretch = this.getInheritStyle('font-stretch');
    const fontSize = this.fontSize;
    // const lineHeight = this.lineHeight;
    const lineHeight = '';
    const fontFamily = this.getInheritStyle('font-family') || DEFAULT_FONT_FAMILY;
    return [
      fontStyle,
      fontVariant,
      fontWeight,
      fontStretch,
      lineHeight ? `${fontSize}px/${lineHeight}` : `${fontSize}px`,
      fontFamily,
    ].filter(i => i).join(' ');
  }

  public get fontSize() {
    const fontSize = this.getInheritStyle('font-size') || DEFAULT_FONT_SIZE;
    return parseInt(fontSize);
  }

  public get lineHeight() {
    const lineHeight = this.style['line-height'] || DEFAULT_LINE_HEIGHT;
    if (/px$/.test(lineHeight)) {
      return parseFloat(lineHeight);
    } else if (/^\d+(.\d+)?$/.test(lineHeight)) {
      return parseFloat(lineHeight)
    }
    return +DEFAULT_LINE_HEIGHT;
  }

  /**
   * 背景继承只局限于inline元素
   */
  public get background(): {
    color: string;
    image: string;
    position: {
      left: number;
      top: number;
    };
    repeat: 'no-repeat' | 'repeat-x' | 'repeat-y';
    size: {
      width: number;
      height: number;
    }
  } {
    // if (this.element.nodeType === NodeType.TEXT_NODE) {
    //   const parent = this.element.parentNode;
    //   while (parent) {
    //     if (parent.nodeType === NodeType.TEXT_NODE && parent.blockType === BlockType.inline) {
    //       return parent.style.background;
    //     } else {
    //       return {};
    //     }
    //   }
    //   return {};
    // }
    if (this.element.nodeType === NodeType.TEXT_NODE && this.element.parentNode) {
      return this.element.parentNode.style.background;
    }

    const all = this.style['background'];
    let allIdx = this.styleIndex['background'] || -1;

    let image = this.style['background-image'];
    let imageIdx = this.styleIndex['background-image'] || -1;

    let color = this.style['background-color'];
    let colorIdx = this.styleIndex['background-color'] || -1;

    let position = this.style['background-position'];
    let positionIdx = this.styleIndex['background-position'] || -1;

    let size = this.style['background-size'];
    let sizeIdx = this.styleIndex['background-size'] || -1;

    let repeat = this.style['background-repeat'];
    let repeatIdx = this.styleIndex['background-repeat'] || -1;

    // console.log(all);
    /**
     * 下面的一个或多个值，可以按任意顺序放置：
     * <attachment>
     * 参见 background-attachment
     * <box>
     * 参见 background-clip 和 background-origin
     * <background-color>
     * 参见 background-color
     * <bg-image>
     * 参见 background-image
     * <position>
     * 参见 background-position
     * <repeat-style>
     * 参见 background-repeat
     * <bg-size>
     * 参见 background-size
     */
    const full = `${all || ''}`.split(/\s+/);
    // console.log(full);
    for (let i = 0; i < full.length; i++) {
      const item = full[i];
      if (/#([a-z0-9]{3,6})/i.test(item) && colorIdx && allIdx > colorIdx) {
        color = item;
      }
    }

    return {
      image,
      color,
      position,
      size,
      repeat,
    } as any;
  }

  public get width() {
    return this.style['width'];
  }

  public get height() {
    return this.style['height'];
  }

  public get padding() {
    return this.getRoundStyle('padding');
  }

  public get margin() {
    return this.getRoundStyle('margin');
  }

  public get border(): IRound<IBorder> {
    const all = this.style['border'];
    const allIdx = this.styleIndex['border'];
    const dir = ['top', 'right', 'bottom', 'left'];
    return dir.reduce((total, key) => {
      const value = this.style[`border-${key}`];
      const idx = this.styleIndex[`border-${key}`]
      let width, style, color;
      if (value && all) {
        ;[width, style, color] = `${(allIdx > idx ? all : value) || ''}`.split(/\s+/);
      } else if (value) {
        ;[width, style, color] = `${value || ''}`.split(/\s+/);
      } else {
        ;[width, style, color] = `${all || ''}`.split(/\s+/);
      }
      // @ts-ignore
      total[key] = {
        width: this.transformUnitToPx(width),
        style,
        color,
      };
      return total;
    }, {}) as IRound<IBorder>;
  }

  /**
   * 属性继承自任意父级
   */
  public get isNoWrap() {
    let element: Element | null = this.element;
    while (element) {
      const whiteSpace = element.style.get('white-space');
      if (whiteSpace) {
        if (whiteSpace === 'nowrap') { // 强制不换行
          return true;
        } else {
          return false;
        }
      }
      element = element.parentNode;
    }
    return false;
  }

  // public get isOverflow() {
  // return this.style['overflow'] === 'hidden' || this.style['overflow']
  // }

  public get isHidden() {
    return this.style['display'] === 'none';
  }

  public get isAbsolute() {
    return this.style['position'] === 'absolute';
  }

  public get isRelative() {
    return this.style['position'] === 'relative';
  }

  public get isFloat() {
    const float = this.style['float'];
    return float === 'left' || float === 'right';
  }
}