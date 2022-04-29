import Element from './element';
import {BackgroundAttachment, BackgroundClip, BackgroundPosition, BackgroundRepeat, BackgroundSize, BlockType, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT, NodeType, REG_BG_ATTACHMENT, REG_BG_CLIP, REG_BG_POSITION_SIZE, REG_BG_REPEAT, REG_BORDER, REG_BORDER_COLOR, REG_BORDER_RADIUS, REG_BORDER_STYLE, REG_BORDER_WIDTH, REG_COLOR, REG_EM, REG_PCT, REG_PX, REG_REM, REG_URL} from './constants';
import ElementImage from './element-image';

// import ElementImage from './element-image';

interface IRound<T = any> {
  top: T;
  right: T;
  bottom: T;
  left: T;

  [x: string]: T;
}

export interface IBorder {
  width: number;
  style: string;
  color: string;

  [x: string]: any;
}

export interface IBackground<T = string | number> {
  color: string;
  image: string;
  position: {
    left: T;
    leftOffset: T;
    top: T;
    topOffset: T;
  };
  size: {
    width: T;
    height: T;
  }
  repeat: BackgroundRepeat;
  attachment: BackgroundAttachment;
  origin: BackgroundClip;
  clip: BackgroundClip;
}

export interface ITextDecoration {
  line: string;
  style: string;
  color: string;
  thickness: string;
}

export interface ISize<T = any> {
  width: T;
  height: T;
}

export interface IRadius<T = string | number> {
  topLeft: ISize<T>;
  topRight: ISize<T>;
  bottomRight: ISize<T>;
  bottomLeft: ISize<T>;

  [x: string]: any;
}

/**
 * 样式处理
 */
export default class Style {
  private style: { [x: string]: string } = {};
  private styleIndex: { [x: string]: number } = {};
  private index = 0;
  private element: Element;

  public imageMap: { [x: string]: ElementImage } = {};

  public constructor(element: Element) {
    this.element = element;
  }

  public getImage = (url: string) => {
    return this.imageMap[url];
  };

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

  public getOriginRoundStyle(style: string): IRound<string> {
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
        allResult.bottom = list[2];
        allResult.left = list[3];
      }
    }
    return dir.reduce<any>((map, key) => {
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
  };

  /**
   * 获取 简写 和 四个方向的样式属性值
   * 处理书写优先级
   * @param style
   */
  private getRoundStyle(style: string) {
    const dir = ['top', 'right', 'bottom', 'left'];
    const result: IRound<string | number> = this.getOriginRoundStyle(style);
    dir.forEach((key) => {
      if (result[key] === 'auto') {
        result[key] = 0;
      } else {
        result[key] = this.transformUnitToPx(result[key] as string);
      }
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
  public transformUnitToPx(unit: string, base?: number): number {
    if (!unit || unit === '0') {
      return 0;
    }
    if (REG_PX.test(unit)) {
      return parseInt(unit);
    }
    if (!base) {
      throw new Error(`missing unit [${unit}]`);
    }
    if (REG_PCT.test(unit)) {
      return base * parseInt(unit) / 100;
    } else if (REG_REM.test(unit)) {
      return base * parseInt(unit);
    } else if (REG_EM.test(unit)) {
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
    if (REG_PX.test(lineHeight)) {
      return parseFloat(lineHeight);
    } else if (/^\d+(.\d+)?$/.test(lineHeight)) {
      return parseFloat(lineHeight)
    }
    return +DEFAULT_LINE_HEIGHT;
  }

  /**
   * 文字修饰
   */
  public get textDecoration() {

    return {};
  }

  /**
   * 背景继承只局限于inline元素
   */
  public get background(): IBackground<string>[] {
    if (this.element.nodeType === NodeType.TEXT_NODE &&
      this.element.parentNode && this.element.parentNode.blockType === BlockType.inline) {
      return this.element.parentNode.style.background;
    }

    // TODO 背景样式优先级处理

    const all = this.style['background'];
    let allIdx = this.styleIndex['background'] || -1;

    // let image = this.style['background-image'];
    // let imageIdx = this.styleIndex['background-image'] || -1;
    //
    // let color = this.style['background-color'];
    // let colorIdx = this.styleIndex['background-color'] || -1;
    //
    // let position = this.style['background-position'];
    // let positionIdx = this.styleIndex['background-position'] || -1;
    //
    // let size = this.style['background-size'];
    // let sizeIdx = this.styleIndex['background-size'] || -1;
    //
    // let repeat = this.style['background-repeat'];
    // let repeatIdx = this.styleIndex['background-repeat'] || -1;

    const colors: string[] = [];
    // console.log(all);
    const list = `${all}`.replace(REG_COLOR, (matched) => {
      colors.push(matched);
      return '';
    }).split(',');
    const backgrounds = list.map<IBackground<string>>((full, index) => {
      let color = colors[index] || '';
      let image = '';
      const position = {
        left: BackgroundPosition.left,
        leftOffset: '',
        top: BackgroundPosition.top,
        topOffset: '',
      };
      const size = {
        width: BackgroundSize.auto,
        height: BackgroundSize.auto,
      };
      let repeat = BackgroundRepeat.repeat
      let clip = BackgroundClip.borderBox
      let origin: BackgroundClip = '' as BackgroundClip;
      let attachment = BackgroundAttachment.scroll

      full.replace(REG_URL, (matched, g1, g2, g3) => {
        image = g1 || g2 || g3;
        return '';
      }).replace(REG_BG_REPEAT, (matched) => {
        repeat = matched as BackgroundRepeat;
        return '';
      }).replace(REG_BG_CLIP, (matched) => {
        if (origin) {
          clip = matched as BackgroundClip;
        } else {
          clip = origin = matched as BackgroundClip;
        }
        return '';
      }).replace(REG_BG_ATTACHMENT, (matched) => {
        attachment = matched as BackgroundAttachment;
        return '';
      }).replace(REG_BG_POSITION_SIZE, (...args) => {
        let [
          , leftAll, leftEnum, leftEnumAllOffset, leftAllUnit,
          topAll, topEnum, topEnumAllOffset, topAllUnit,
          sizeEnum,
          widthAll,
          heightAll,
        ] = args;

        if (leftEnumAllOffset && !topAll) {
          // topAll = leftEnumAllOffset;
          topEnumAllOffset = leftEnumAllOffset;
          leftEnumAllOffset = '';
        }

        if (leftAll) {
          position.left = leftEnum || leftAllUnit;
          if (leftAllUnit) {
            position.leftOffset = position.left;
            position.left = BackgroundPosition.left;
          }
        }

        if (leftEnumAllOffset) {
          position.leftOffset = leftEnumAllOffset;
        }

        if (topAll) {
          position.top = topEnum || topAllUnit;
          if (topAllUnit) {
            position.topOffset = position.top;
            position.top = BackgroundPosition.top;
          }
        } else if (leftEnum && leftEnum === BackgroundPosition.center) {
          position.top = BackgroundPosition.center;
        }

        if (topEnumAllOffset) {
          position.topOffset = topEnumAllOffset;
        }

        if (sizeEnum) {
          size.height = size.width = sizeEnum
        } else {
          if (widthAll) {
            size.width = widthAll
          }
          if (heightAll) {
            size.height = heightAll;
          }
        }
        return '';
      });

      origin = origin || BackgroundClip.borderBox;

      return {
        color,
        image,
        position,
        size,
        repeat,
        attachment,
        origin,
        clip,
      }
    });
    return backgrounds;
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
    const parseBorder = (border: string) => {
      const item = {width: 0, style: '', color: '', image: ''};
      `${border || ''}`.replace(REG_BORDER, (matched, width, style, color) => {
        item.width = this.transformUnitToPx(width);
        item.style = style;
        item.color = color;
        return '';
      });
      return item;
    };

    const parseWidth = (width: string) => {
      // TODO 边框枚举宽度处理
      if (REG_BORDER_WIDTH.test(width)) {
        return this.transformUnitToPx(width);
      }
      return 0;
    };

    const parseStyle = (style: string) => {
      return REG_BORDER_STYLE.test(style) ? style : '';
    }

    const parseColor = (color: string) => {
      return REG_BORDER_COLOR.test(color) ? color : '';
    };

    const all = parseBorder(this.style['border']);
    const allIndex = this.styleIndex['border'] || 0;

    let top = {...all};
    let right = {...all};
    let bottom = {...all};
    let left = {...all};

    const single = [
      this.style['border-top'] ? parseBorder(this.style['border-top']) : top,
      this.style['border-right'] ? parseBorder(this.style['border-right']) : right,
      this.style['border-bottom'] ? parseBorder(this.style['border-bottom']) : bottom,
      this.style['border-left'] ? parseBorder(this.style['border-left']) : left,
    ];

    const singleIndex = [
      this.styleIndex['border-top'] || 0,
      this.styleIndex['border-right'] || 0,
      this.styleIndex['border-bottom'] || 0,
      this.styleIndex['border-left'] || 0,
    ];

    const width = [
      parseWidth(this.style['border-top-width']),
      parseWidth(this.style['border-right-width']),
      parseWidth(this.style['border-bottom-width']),
      parseWidth(this.style['border-left-width']),
    ]

    const widthIndex = [
      this.styleIndex['border-top-width'] || 0,
      this.styleIndex['border-right-width'] || 0,
      this.styleIndex['border-bottom-width'] || 0,
      this.styleIndex['border-left-width'] || 0,
    ]

    widthIndex.forEach((i, idx) => {
      if (i > singleIndex[idx]) {
        single[idx].width = width[idx];
      }
    })

    const style = [
      parseStyle(this.style['border-top-style']),
      parseStyle(this.style['border-right-style']),
      parseStyle(this.style['border-bottom-style']),
      parseStyle(this.style['border-left-style']),
    ]

    const styleIndex = [
      this.styleIndex['border-top-style'] || 0,
      this.styleIndex['border-right-style'] || 0,
      this.styleIndex['border-bottom-style'] || 0,
      this.styleIndex['border-left-style'] || 0,
    ]

    styleIndex.forEach((i, idx) => {
      if (i > singleIndex[idx]) {
        single[idx].style = style[idx];
      }
    })

    const color = [
      parseColor(this.style['border-top-color']),
      parseColor(this.style['border-right-color']),
      parseColor(this.style['border-bottom-color']),
      parseColor(this.style['border-left-color']),
    ];

    const colorIndex = [
      this.styleIndex['border-top-color'] || 0,
      this.styleIndex['border-right-color'] || 0,
      this.styleIndex['border-bottom-color'] || 0,
      this.styleIndex['border-left-color'] || 0,
    ]

    colorIndex.forEach((i, idx) => {
      if (i > singleIndex[idx]) {
        single[idx].color = color[idx];
      }
    });

    if (singleIndex[0] > allIndex) {
      top = single[0];
    }
    if (singleIndex[1] > allIndex) {
      right = single[1];
    }
    if (singleIndex[2] > allIndex) {
      bottom = single[2];
    }
    if (singleIndex[3] > allIndex) {
      left = single[3];
    }
    return {
      top,
      right,
      bottom,
      left,
    }
  }

  public get radius() {
    // TODO 处理优先级样式
    const topLeft: ISize<number | string> = {width: 0, height: 0};
    const topRight: ISize<number | string> = {width: 0, height: 0};
    const bottomRight: ISize<number | string> = {width: 0, height: 0};
    const bottomLeft: ISize<number | string> = {width: 0, height: 0};
    const all = this.style['border-radius'];

    if (all) {
      all.replace(REG_BORDER_RADIUS, (matched, ...args) => {
        const [
          hasWidth,
          wTop, wRight, wBottom, wLeft,
          wTop1, wLeftRight, wBottom1,
          wTopBottom, wLeftRight1,
          wAll,

          hasHeight,
          hTop, hRight, hBottom, hLeft,
          hTop1, hLeftRight, hBottom1,
          hTopBottom, hLeftRight1,
          hAll,
        ] = args;

        if (wTop) {
          topLeft.width = topLeft.height = wTop;
          topRight.width = topRight.height = wRight;
          bottomRight.width = bottomRight.height = wBottom;
          bottomLeft.width = bottomLeft.height = wLeft;
        } else if (wTop1) {
          topLeft.width = topLeft.height = wTop;
          bottomLeft.width = bottomLeft.height = topRight.width = topRight.height = wLeftRight;
          bottomRight.width = bottomRight.height = wBottom1;
        } else if (wTopBottom) {
          topLeft.width = topLeft.height = bottomRight.width = bottomRight.height = wTopBottom;
          bottomLeft.width = bottomLeft.height = topRight.width = topRight.height = wLeftRight1;
        } else if (wAll) {
          topLeft.width = topLeft.height = topRight.width = topRight.height = bottomRight.width = bottomRight.height = bottomLeft.width = bottomLeft.height = wAll;
        }

        if (hasHeight) { // 高度和宽度不一致 则 重新设置宽度
          if (hTop) {
            topLeft.height = hTop;
            topRight.height = hRight;
            bottomRight.height = hBottom;
            bottomLeft.height = hLeft;
          } else if (hTop1) {
            topLeft.height = hTop1;
            bottomLeft.height = topRight.height = hLeftRight;
            bottomRight.height = hBottom1;
          } else if (hTopBottom) {
            topLeft.height = bottomRight.height = hTopBottom;
            bottomLeft.height = topRight.height = hLeftRight1;
          } else if (hAll) {
            topLeft.height = topRight.height = bottomRight.height = bottomLeft.height = hAll;
          }
        }
        return '';
      });
    }

    const {offsetWidth, offsetHeight} = this.element;
    const {margin} = this;
    const contentWidth = offsetWidth - margin.left - margin.right;
    const contentHeight = offsetHeight - margin.top - margin.bottom;
    const maxWidth = contentWidth / 2;
    const maxHeight = contentHeight / 2;
    ;[topLeft, topRight, bottomRight, bottomLeft].forEach(item => {

      // TODO
      //  1、处理枚举默认值
      //  2、处理其他单位数值
      if (REG_PX.test(item.width as string)) {
        item.width = this.transformUnitToPx(item.width as string);
      } else if (REG_PCT.test(item.width as string)) {
        item.width = this.transformUnitToPx(item.width as string, contentWidth);
      }

      item.width = item.width > maxWidth ? maxWidth : item.width;

      if (REG_PX.test(item.height as string)) {
        item.height = this.transformUnitToPx(item.height as string);
      } else if (REG_PCT.test(item.height as string)) {
        item.height = this.transformUnitToPx(item.height as string, contentHeight);
      }

      item.height = item.height > maxHeight ? maxHeight : item.height;
    })

    return {
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
      maxWidth,
      maxHeight,
    } as IRadius<number>;
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