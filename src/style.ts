import Element from './element';
import {
  BackgroundAttachment,
  BackgroundClip,
  BackgroundPosition,
  BackgroundRepeat,
  BackgroundSize,
  BlockType,
  BORDER_STYLE,
  DEFAULT_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_VERTICAL_ALIGN,
  GradientType,
  NodeType,
  REG_BG_ATTACHMENT,
  REG_BG_CLIP, REG_BG_POS_ENUM,
  REG_BG_POSITION,
  REG_BG_POSITION_SIZE,
  REG_BG_REPEAT,
  REG_BG_SIZE,
  REG_BORDER,
  REG_BORDER_COLOR,
  REG_BORDER_RADIUS,
  REG_BORDER_STYLE,
  REG_BORDER_WIDTH,
  REG_COLOR,
  REG_EM,
  REG_GRADIENT_COLOR_SIZE,
  REG_GRADIENT_DIRECTION,
  REG_GRADIENT_TYPE,
  REG_NUM,
  REG_PCT, REG_POS_LR, REG_POS_TB,
  REG_PX,
  REG_RADIUS_VALUE,
  REG_REM,
  REG_ROUND_AUTO_VALUE,
  REG_TEXT_DECORATION_COLOR,
  REG_TEXT_DECORATION_LINE,
  REG_TEXT_DECORATION_STYLE,
  REG_TEXT_DECORATION_THICKNESS,
  REG_URL,
  styleKeywords,
  TEXT_DECORATION_LINE,
  TEXT_DECORATION_STYLE,
  TextAlign,
} from './constants';
import ElementImage from './element-image';

interface IRound<T = any> {
  top: T;
  right: T;
  bottom: T;
  left: T;

  [x: string]: T;
}

export interface IBorder {
  width: number;
  style: BORDER_STYLE;
  color: string;

  [x: string]: any;
}

export interface IBackground<T = string | number> {
  color: string;
  image: string;
  gradient?: IGradient;
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

export interface IGradientColor {
  color: string;
  stop: string;
}

export interface IGradient {
  type: GradientType;
  angle: number;
  list: IGradientColor[];
}

export interface ITextDecoration {
  line: TEXT_DECORATION_LINE;
  style: TEXT_DECORATION_STYLE;
  color: string;
  thickness: number;
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
  private cachedValue: any = {};
  private static cachedFunction: { [x: string]: Function } = {};

  [x: string]: any;

  public imageMap: { [x: string]: ElementImage } = {};

  public constructor(element: Element) {
    this.element = element;
  }

  public updateCache = () => {
    // TODO cache缓存错误
    return;
    const proto = Object.getPrototypeOf(this);
    const descriptors = Object.getOwnPropertyDescriptors(proto);

    const fns = Object.keys(Style.cachedFunction)
    if (fns.length) {
      fns.forEach(key => {
        this.cachedValue[key] = Style.cachedFunction[key].call(this);
      });
    } else {
      Object.keys(descriptors).forEach((key) => {
        const descriptor = descriptors[key];
        const {get} = descriptor;
        if (typeof get === 'function') {
          Style.cachedFunction[key] = get;
          Object.defineProperty(proto, key, {
            ...descriptor,
            get() {
              if (!this.cachedValue[key]) {
                this.cachedValue[key] = get.call(this);
              }
              return this.cachedValue[key];
            },
          })
        }
      });
    }
  };

  public getImage = (url: string) => {
    return this.imageMap[url];
  };

  /**
   * 获取包含自身的继承样式
   * @param style
   * @param force 强制回溯到任意父级
   */
  public getInheritStyle(style: string, force = false) {
    const {element, value} = this.getInheritNode(style, force);
    if (element) {
      return value;
    }
    return null;
  }

  /**
   * 获取指定的继承元素和样式
   * @param style
   * @param force
   */
  public getInheritNode(style: string, force = false) {
    let element: Element | null = this.element;
    while (element) {
      const value = element.style.get(style);
      if (value && value !== styleKeywords.inherit) {
        return {element, value};
      }
      if (!force && element) {
        if (element.style.isAbsolute || element.style.isFloat) {
          break;
        }
      }
      element = element.parentNode;
    }
    return {element: null, value: ''};
  }

  public getOriginRoundStyle(style: string): IRound<string> {
    const all = this.style[style];
    const allIndex = this.styleIndex[style] || 0;

    const round: IRound<string> = {
      top: '',
      right: '',
      bottom: '',
      left: '',
    };

    ;`${all}`.replace(REG_ROUND_AUTO_VALUE, (matched, ...args) => {
      const [
        , top, right, bottom, left,
        top1, leftRight, bottom1,
        topBottom, leftRight1,
        all,
      ] = args;

      if (top) {
        round.top = top;
        round.right = right;
        round.bottom = bottom;
        round.left = left;
      } else if (top1) {
        round.top = top1;
        round.right = leftRight;
        round.bottom = bottom1;
        round.left = leftRight;
      } else if (topBottom) {
        round.top = topBottom;
        round.right = leftRight1;
        round.bottom = topBottom;
        round.left = leftRight1;
      } else if (all) {
        round.top = all;
        round.right = all;
        round.bottom = all;
        round.left = all;
      }
      return '';
    });

    Object.keys(round).forEach(key => {
      const fullKey = `${style}-${key}`
      const idx = this.styleIndex[fullKey] || 0;
      if (idx > allIndex) {
        round[key] = this.style[fullKey];
      }
    });
    return round;
  };

  /**
   * 获取 简写 和 四个方向的样式属性值
   * 处理书写优先级
   * @param style
   */
  private getRoundStyle(style: string) {
    const dir = [styleKeywords.top, styleKeywords.right, styleKeywords.bottom, styleKeywords.left];
    const result: IRound<string | number> = this.getOriginRoundStyle(style);
    dir.forEach((key) => {
      if (result[key] === styleKeywords.auto) {
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
    this.updateCache();
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
    const fontStyle = this.getInheritStyle(styleKeywords.fontStyle, true);
    const fontVariant = this.getInheritStyle(styleKeywords.fontVariant, true);
    const fontWeight = this.getInheritStyle(styleKeywords.fontWeight, true);
    const fontStretch = this.getInheritStyle(styleKeywords.fontStretch, true);
    const fontSize = this.fontSize;
    // const lineHeight = this.lineHeight;
    const lineHeight = '';
    const fontFamily = this.getInheritStyle(styleKeywords.fontFamily, true) || DEFAULT_FONT_FAMILY;
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
    const fontSize = this.getInheritStyle(styleKeywords.fontSize, true) || DEFAULT_FONT_SIZE;
    return parseInt(fontSize);
  }

  /**
   * 文字修饰
   */
  public get textDecoration(): ITextDecoration[] {
    // TODO P3 处理优先级
    let all = this.getInheritStyle(styleKeywords.textDecoration);

    const decorations: ITextDecoration[] = [];
    let color = '#000';
    let style: TEXT_DECORATION_STYLE = '' as TEXT_DECORATION_STYLE;
    let thickness = 1;
    let hasNone = false;

    ;`${all}`.replace(REG_TEXT_DECORATION_COLOR, (matched) => {
      color = matched;
      return '';
    }).replace(REG_TEXT_DECORATION_STYLE, (matched) => {
      style = matched as TEXT_DECORATION_STYLE;
      return '';
    }).replace(REG_TEXT_DECORATION_THICKNESS, (matched) => {
      thickness = this.transformUnitToPx(matched);
      return '';
    }).replace(REG_TEXT_DECORATION_LINE, (matched) => {
      if (matched === styleKeywords.none) {
        hasNone = true;
      } else {
        decorations.push({
          color,
          style,
          line: matched as TEXT_DECORATION_LINE,
          thickness,
        });
      }
      return '';
    });
    if (hasNone) {
      return [];
    }
    return decorations;
  }

  /**
   * 背景继承只局限于inline元素
   */
  public get background(): IBackground<string>[] {
    let element: Element | null = this.element;
    if (element.nodeType === NodeType.TEXT_NODE) {
      element = element.parentNode
      // 背景继承规则文本只继承inline父元素的背景
      if (element && element.blockType !== BlockType.inline) {
        return [];
      }
    }

    if (!element) {
      return [];
    }

    const parseGradient = (all: string) => {
      const list = all.split(REG_GRADIENT_TYPE);
      const gradients: IGradient[] = [];
      let merged = list.reduce<string[]>((total, current) => {
        if (REG_GRADIENT_TYPE.test(current)) {
          total.push(current);
        } else if (total.length) {
          total[total.length - 1] += current;
        }
        return total;
      }, []);
      merged.forEach(gradient => {
        const stack: string[] = [];
        let idx = 0;
        let matched;
        let reg = /\(|\)/g;
        do {
          matched = reg.exec(gradient);
          if (matched) {
            if (matched[0] === '(') {
              stack.push(matched[0]);
            } else {
              stack.pop();
              if (stack.length === 0) {
                idx = matched.index;
                break;
              }
            }
          } else {
            throw new Error(`gradient error [${gradient}]`);
          }
        } while (matched)

        const full = gradient.slice(0, idx + 1);

        // @ts-ignore
        let gradientObject: IGradient = {};
        full.replace(REG_GRADIENT_DIRECTION, (_, ...args) => {
          let [
            type,
            hasDirection,
            toVertical, toHorizontal,
            toHorizontal1, toVertical1,
            toVertical2, toHorizontal2,
            angle,
          ] = args;

          /*
          * The values
          * to top, to bottom, to left, and to right are
          * equivalent to the angles 0deg, 180deg, 270deg, and 90deg,
          * respectively. The other values are translated into an angle.
          * */

          if (hasDirection) {
            if (toVertical || toHorizontal1) {
              if (toHorizontal1) {
                toVertical = toVertical1;
                toHorizontal = toHorizontal1;
              }
              if (toVertical === styleKeywords.top) {
                if (toHorizontal === styleKeywords.left) {
                  angle = -45;
                } else {
                  angle = 45;
                }
              } else {
                if (toHorizontal === styleKeywords.left) {
                  angle = 225;
                } else {
                  angle = -225;
                }
              }
            } else if (toVertical2) {
              if (toVertical2 === styleKeywords.top) {
                // to top
                angle = 0;
              } else {
                // to bottom
                angle = 180;
              }
            } else if (toHorizontal2) {
              if (toHorizontal2 === styleKeywords.left) {
                // to left
                angle = 270;
              } else {
                // to right
                angle = 90;
              }
            } else if (angle) {
              // @ts-ignore
              angle = parseFloat(angle);
            }
          } else {
            // 默认是180 十二点方向是0度
            angle = 180;
          }

          gradientObject = {
            type: type as GradientType,
            angle,
            list: [],
          };
          return '';
        }).replace(REG_GRADIENT_COLOR_SIZE, (_, color, stop) => {
          gradientObject.list.push({
            color,
            stop,
          })
          return '';
        });
        all = all.replace(full, '');
        gradients.push(gradientObject);
        return full;
      });
      return {
        restStyle: all,
        gradients,
      }
    }

    let all = element.style.style[styleKeywords.background];
    const allIdx = element.style.styleIndex[styleKeywords.background] || 0;

    const colors: string[] = [];
    let gradients: IGradient[] = [];

    if (REG_GRADIENT_TYPE.test(all)) {
      const parsed = parseGradient(all);
      gradients = parsed.gradients;
      all = parsed.restStyle;
    }

    // 优先处理color
    let list = `${all || ''}`.replace(REG_COLOR, (matched) => {
      colors.push(matched);
      return '';
    }).split(',');

    // 出现多个color 则背景不生效
    if (colors.length > 1) {
      list = [];
    }

    const backgrounds = list.map<IBackground<string>>((full, index) => {
      let color = '';
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
      let attachment = BackgroundAttachment.scroll;
      let gradient = gradients[index];

      if (index === list.length - 1) {
        color = colors[0];
      }

      full.replace(REG_URL, (matched, g1, g2, g3) => {
        if (gradient) {
          throw new Error('渐变和背景图不能一起使用');
        } else {
          image = g1 || g2 || g3;
        }
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

      origin = origin || BackgroundClip.paddingBox;

      return {
        color,
        image,
        gradient,
        position,
        size,
        repeat,
        attachment,
        origin,
        clip,
      }
    });

    if (process.env.FULL_SUPPORT) {
      const getDefaultBackground = () => ({
        color: '',
        image: '',
        position: {
          left: BackgroundPosition.left,
          leftOffset: '',
          top: BackgroundPosition.top,
          topOffset: '',
        },
        size: {
          width: BackgroundSize.auto,
          height: BackgroundSize.auto,
        },
        repeat: BackgroundRepeat.repeat,
        clip: BackgroundClip.borderBox,
        origin: BackgroundClip.paddingBox,
        attachment: BackgroundAttachment.scroll,
      });

      const image = this.style[styleKeywords.backgroundImage];
      const imageIdx = this.styleIndex[styleKeywords.backgroundImage] || 0;

      const color = this.style[styleKeywords.backgroundColor];
      const colorIdx = this.styleIndex[styleKeywords.backgroundColor] || 0;

      const position = this.style[styleKeywords.backgroundPosition];
      const positionIdx = this.styleIndex[styleKeywords.backgroundPosition] || 0;

      const size = this.style[styleKeywords.backgroundSize];
      const sizeIdx = this.styleIndex[styleKeywords.backgroundSize] || 0;

      const repeat = this.style[styleKeywords.backgroundRepeat];
      const repeatIdx = this.styleIndex[styleKeywords.backgroundRepeat] || 0;

      const clip = this.style[styleKeywords.backgroundClip];
      const clipIdx = this.styleIndex[styleKeywords.backgroundClip] || 0;

      const origin = this.style[styleKeywords.backgroundOrigin];
      const originIdx = this.styleIndex[styleKeywords.backgroundOrigin] || 0;

      if (positionIdx > allIdx) {
        position.split(',').forEach((s, index) => {
          s.trim().replace(REG_BG_POSITION, (matched, ...args) => {
            let [
              leftEnum, leftUnit, topEnum, topUnit,
              dirEnum, oneUnit, twoUnit,
              leftEnum1, leftUnit1, topEnum1, topUnit1,
              oneEnum, oneUnit1,
            ] = args;

            if (!backgrounds[index]) {
              backgrounds.push(getDefaultBackground());
            }

            const position = backgrounds[index].position;

            if (leftEnum) {
              position.left = leftEnum;
              position.leftOffset = leftUnit;
              position.top = topEnum;
              position.topOffset = topUnit;
            } else if (dirEnum) {
              if (REG_POS_LR.test(dirEnum) || dirEnum === styleKeywords.center) { // left right
                position.left = dirEnum;
                if (REG_BG_POS_ENUM.test(oneUnit)) {
                  position.leftOffset = '';
                  position.top = oneUnit;
                  if (REG_BG_POS_ENUM.test(twoUnit)) {
                    console.warn(`语法错误 background-position: ${this.style[styleKeywords.backgroundPosition]}`, this.element);
                  } else {
                    position.topOffset = twoUnit;
                  }
                } else {
                  position.leftOffset = oneUnit;
                  if (REG_POS_TB.test(twoUnit)) {
                    position.top = twoUnit;
                    position.topOffset = '';
                  } else {
                    console.warn(`语法错误 background-position: ${this.style[styleKeywords.backgroundPosition]}`, this.element);
                  }
                }
              } else if (REG_POS_TB.test(dirEnum)) { // top bottom
                position.top = dirEnum;
                if (REG_BG_POS_ENUM.test(oneUnit)) {
                  position.topOffset = '';
                  position.left = oneUnit;
                  if (REG_BG_POS_ENUM.test(twoUnit)) {
                    console.warn(`语法错误 background-position: ${this.style[styleKeywords.backgroundPosition]}`, this.element);
                  } else {
                    position.leftOffset = twoUnit;
                  }
                } else {
                  position.topOffset = oneUnit;
                  if (REG_BG_POS_ENUM.test(twoUnit)) {
                    position.top = twoUnit;
                    position.topOffset = '';
                  } else {
                    console.warn(`语法错误 background-position: ${this.style[styleKeywords.backgroundPosition]}`, this.element);
                  }
                }
              }
            } else if (leftEnum1 || leftUnit1 || topEnum1 || topUnit1) {
              if (leftEnum1 && topEnum1) { // left top
                if (REG_POS_LR.test(leftEnum1)) {
                  position.left = leftEnum1;
                  position.top = topEnum1;
                } else {
                  position.left = topEnum1;
                  position.top = leftEnum1;
                }
                position.leftOffset = '';
                position.topOffset = '';
              } else if (leftUnit1 && topUnit1) { // 10px 10px
                position.left = styleKeywords.left;
                position.top = styleKeywords.top;
                position.leftOffset = leftUnit1;
                position.topOffset = topUnit1;
              } else {
                if (leftEnum1 && topUnit1) {
                  if (REG_POS_LR.test(leftEnum1)) { // left 10px
                    position.left = leftEnum1;
                    position.leftOffset = '';
                    position.top = styleKeywords.top;
                    position.topOffset = topUnit1;
                  } else { // bottom 10px
                    position.top = leftEnum1;
                    position.topOffset = '';
                    position.left = styleKeywords.left;
                    position.leftOffset = topUnit1;
                  }
                } else if (leftUnit1 && topEnum1) { // 10px top
                  if (REG_POS_TB.test(topEnum1)) {
                    position.left = styleKeywords.left;
                    position.leftOffset = leftUnit1;
                    position.top = topEnum1;
                    position.topOffset = '';
                  } else {
                    console.warn('背景位置无效 不允许出现 [10px left|right] 格式', this.element);
                  }
                }
              }
            } else if (oneEnum || oneUnit1) {
              if (oneEnum) {
                if (REG_POS_LR.test(oneEnum)) {
                  position.left = oneEnum;
                  position.leftOffset = '';
                  position.top = styleKeywords.top;
                  position.topOffset = '50%';
                } else if (REG_POS_TB.test(oneEnum)) {
                  position.left = styleKeywords.left;
                  position.leftOffset = '50%';
                  position.top = oneEnum;
                  position.topOffset = '';
                } else {
                  position.left = styleKeywords.center;
                  position.leftOffset = '';
                  position.top = styleKeywords.center;
                  position.topOffset = '';
                }
              } else {
                position.left = styleKeywords.left;
                position.leftOffset = oneUnit1;
                position.top = styleKeywords.top;
                position.topOffset = '50%';
              }
            }
            return '';
          });
        })
      }

      if (sizeIdx > allIdx) {
        size.split(',').forEach((s, index) => {
          s.trim().replace(REG_BG_SIZE, (matched, ...args) => {
            const [sizeEnum, widthAll, heightAll] = args;
            if (!backgrounds[index]) {
              backgrounds.push(getDefaultBackground());
            }
            const size = backgrounds[index].size;
            if (sizeEnum) {
              size.width = sizeEnum
            } else {
              if (widthAll) {
                size.width = widthAll;
              }
              if (heightAll) {
                size.height = heightAll;
              } else {
                size.height = styleKeywords.auto;
              }
            }
            return '';
          })
        })
      }

      if (imageIdx > allIdx) {
        // TODO 处理单个属性渐变
        if (REG_GRADIENT_TYPE.test(image)) {
          const parsed = parseGradient(image);
          parsed.gradients.forEach((gradient, index) => {
            if (!backgrounds[index]) {
              backgrounds.push(getDefaultBackground());
            }
            backgrounds[index].gradient = gradient;
          })
        } else {
          image.split(',').forEach((s, index) => {
            s.replace(REG_URL, (matched, g1, g2, g3) => {
              if (!backgrounds[index]) {
                backgrounds.push(getDefaultBackground());
              }
              backgrounds[index].image = g1 || g2 || g3;
              return '';
            })
          })
        }
      }

      if (repeatIdx > allIdx) {
        repeat.split(',').forEach((s, index) => {
          s.replace(REG_BG_REPEAT, (matched) => {
            if (!backgrounds[index]) {
              backgrounds.push(getDefaultBackground());
            }
            backgrounds[index].repeat = matched as BackgroundRepeat;
            return '';
          })
        })
      }

      if (clipIdx > allIdx) {
        clip.split(',').forEach((s, index) => {
          s.replace(REG_BG_CLIP, (matched) => {
            if (!backgrounds[index]) {
              backgrounds.push(getDefaultBackground());
            }
            backgrounds[index].clip = matched as BackgroundClip;
            return '';
          })
        })
      }

      if (originIdx > allIdx) {
        origin.split(',').forEach((s, index) => {
          s.replace(REG_BG_CLIP, (matched) => {
            if (!backgrounds[index]) {
              backgrounds.push(getDefaultBackground());
            }
            backgrounds[index].origin = matched as BackgroundClip;
            return '';
          })
        })
      }

      // 背景颜色只有一个
      if (colorIdx > allIdx && REG_COLOR.test(color)) {
        if (backgrounds.length === 0) {
          backgrounds.push(getDefaultBackground())
        }
        backgrounds[backgrounds.length - 1].color = color;
      }
    }

    // 只保留有效内容
    return backgrounds.filter(i => i.color || i.image || i.gradient);
  }

  public get width() {
    return this.style[styleKeywords.width];
  }

  public get height() {
    return this.style[styleKeywords.height];
  }

  public get padding(): IRound<number> {
    const defaultPadding = () => ({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    })
    let element: Element | null = this.element;
    if (element.nodeType === NodeType.TEXT_NODE) {
      element = element.parentNode
      if (element && element.blockType === BlockType.inline) {
        const padding = element.style.padding;
        padding.left = padding.right = 0;
        return padding;
      } else {
        return defaultPadding();
      }
    }
    return this.getRoundStyle(styleKeywords.padding);
  }

  public get margin() {
    return this.getRoundStyle(styleKeywords.margin);
  }

  public get border(): IRound<IBorder> {
    const defaultBorder = () => ({
      top: {width: 0, style: BORDER_STYLE.none, color: '', image: ''},
      right: {width: 0, style: BORDER_STYLE.none, color: '', image: ''},
      bottom: {width: 0, style: BORDER_STYLE.none, color: '', image: ''},
      left: {width: 0, style: BORDER_STYLE.none, color: '', image: ''},
    })

    let element: Element | null = this.element;
    if (element.nodeType === NodeType.TEXT_NODE) {
      element = element.parentNode
      // 边框继承规则文本只继承inline父元素的背景
      if (element && element.blockType === BlockType.inline) {
        return element.style.border;
      } else {
        return defaultBorder();
      }
    }

    const parseBorder = (border: string): IBorder => {
      const item = {width: 0, style: '', color: '', image: ''};
      `${border || ''}`.replace(REG_BORDER, (matched, width, style, color) => {
        item.width = this.transformUnitToPx(width);
        item.style = style;
        item.color = color;
        return '';
      });
      return item as IBorder;
    };

    const parseWidth = (width: string) => {
      // TODO 边框枚举宽度处理
      if (REG_BORDER_WIDTH.test(width)) {
        return this.transformUnitToPx(width);
      }
      return 0;
    };

    const parseStyle = (style: string): BORDER_STYLE => {
      return (REG_BORDER_STYLE.test(style) ? style : '') as BORDER_STYLE;
    }

    const parseColor = (color: string) => {
      return REG_BORDER_COLOR.test(color) ? color : '';
    };

    const all = parseBorder(this.style[styleKeywords.border]);
    const allIndex = this.styleIndex[styleKeywords.border] || 0;

    let top = {...all};
    let right = {...all};
    let bottom = {...all};
    let left = {...all};

    const single = [
      this.style[styleKeywords.borderTop] ? parseBorder(this.style[styleKeywords.borderTop]) : top,
      this.style[styleKeywords.borderRight] ? parseBorder(this.style[styleKeywords.borderRight]) : right,
      this.style[styleKeywords.borderBottom] ? parseBorder(this.style[styleKeywords.borderBottom]) : bottom,
      this.style[styleKeywords.borderLeft] ? parseBorder(this.style[styleKeywords.borderLeft]) : left,
    ];

    const singleIndex = [
      this.styleIndex[styleKeywords.borderTop] || 0,
      this.styleIndex[styleKeywords.borderRight] || 0,
      this.styleIndex[styleKeywords.borderBottom] || 0,
      this.styleIndex[styleKeywords.borderLeft] || 0,
    ];

    if (process.env.FULL_SUPPORT) {

      const width = [
        parseWidth(this.style[styleKeywords.borderTopWidth]),
        parseWidth(this.style[styleKeywords.borderRightWidth]),
        parseWidth(this.style[styleKeywords.borderBottomWidth]),
        parseWidth(this.style[styleKeywords.borderLeftWidth]),
      ]

      const widthIndex = [
        this.styleIndex[styleKeywords.borderTopWidth] || 0,
        this.styleIndex[styleKeywords.borderRightWidth] || 0,
        this.styleIndex[styleKeywords.borderBottomWidth] || 0,
        this.styleIndex[styleKeywords.borderLeftWidth] || 0,
      ]

      widthIndex.forEach((i, idx) => {
        if (i > singleIndex[idx]) {
          single[idx].width = width[idx];
        }
      })

      const style = [
        parseStyle(this.style[styleKeywords.borderTopStyle]),
        parseStyle(this.style[styleKeywords.borderRightStyle]),
        parseStyle(this.style[styleKeywords.borderBottomStyle]),
        parseStyle(this.style[styleKeywords.borderLeftStyle]),
      ]

      const styleIndex = [
        this.styleIndex[styleKeywords.borderTopStyle] || 0,
        this.styleIndex[styleKeywords.borderRightStyle] || 0,
        this.styleIndex[styleKeywords.borderBottomStyle] || 0,
        this.styleIndex[styleKeywords.borderLeftStyle] || 0,
      ]

      styleIndex.forEach((i, idx) => {
        if (i > singleIndex[idx]) {
          single[idx].style = style[idx];
        }
      })

      const color = [
        parseColor(this.style[styleKeywords.borderTopColor]),
        parseColor(this.style[styleKeywords.borderRightColor]),
        parseColor(this.style[styleKeywords.borderBottomColor]),
        parseColor(this.style[styleKeywords.borderLeftColor]),
      ];

      const colorIndex = [
        this.styleIndex[styleKeywords.borderTopColor] || 0,
        this.styleIndex[styleKeywords.borderRightColor] || 0,
        this.styleIndex[styleKeywords.borderBottomColor] || 0,
        this.styleIndex[styleKeywords.borderLeftColor] || 0,
      ]

      colorIndex.forEach((i, idx) => {
        if (i > singleIndex[idx]) {
          single[idx].color = color[idx];
        }
      });
    }

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

  public get radius(): IRadius<number> {
    const defaultRadius = () => ({
      topLeft: {width: 0, height: 0},
      topRight: {width: 0, height: 0},
      bottomRight: {width: 0, height: 0},
      bottomLeft: {width: 0, height: 0},
    })

    let element: Element | null = this.element;
    if (element.nodeType === NodeType.TEXT_NODE) {
      element = element.parentNode
      // TODO radius 继承会导致圆角错误
      if (element && element.blockType === BlockType.inline) {
        return element.style.radius;
      } else {
        return defaultRadius();
      }
    }
    const topLeft: ISize<number | string> = {width: 0, height: 0};
    const topRight: ISize<number | string> = {width: 0, height: 0};
    const bottomRight: ISize<number | string> = {width: 0, height: 0};
    const bottomLeft: ISize<number | string> = {width: 0, height: 0};

    const all = this.style[styleKeywords.borderRadius];
    const allIndex = this.styleIndex[styleKeywords.borderRadius] || 0;

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

    if (process.env.FULL_SUPPORT) {
      const topLeftStyle = {
        target: topLeft,
        key: styleKeywords.borderTopLeftRadius,
      }
      const topRightStyle = {
        target: topRight,
        key: styleKeywords.borderTopRightRadius,
      }
      const bottomRightStyle = {
        target: bottomRight,
        key: styleKeywords.borderBottomRightRadius,
      }
      const bottomLeftStyle = {
        target: bottomLeft,
        key: styleKeywords.borderBottomLeftRadius,
      };

      ;[topLeftStyle, topRightStyle, bottomRightStyle, bottomLeftStyle].forEach(i => {
        const idx = this.styleIndex[i.key] || 0;
        if (idx > allIndex) {
          const value = this.style[i.key];
          value.replace(REG_RADIUS_VALUE, (matched, g1, g2) => {
            i.target.width = i.target.height = g1;
            if (g2) {
              i.target.height = g2;
            }
            return '';
          });
        }
      });
    }

    const {offsetWidth, offsetHeight} = this.element;
    const {margin} = this;
    const contentWidth = offsetWidth - margin.left - margin.right;
    const contentHeight = offsetHeight - margin.top - margin.bottom;
    const maxWidth = contentWidth > 0 ? contentWidth / 2 : 0;
    const maxHeight = contentWidth > 0 ? contentHeight / 2 : 0;
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

  public get color() {
    return this.getInheritStyle(styleKeywords.color, true) || DEFAULT_COLOR;
  }

  public get verticalAlign() {
    return this.getInheritStyle(styleKeywords.verticalAlign, true) || DEFAULT_VERTICAL_ALIGN;
  }

  public get textAlign() {
    return this.getInheritStyle(`${styleKeywords.text}-${styleKeywords.align}`) || TextAlign.left;
  }

  public get lineHeight(): number {
    let lineHeight: string | number = this.getInheritStyle(`${styleKeywords.line}-${styleKeywords.height}`, true) || DEFAULT_LINE_HEIGHT;
    if (REG_PX.test(lineHeight)) {
      lineHeight = parseFloat(lineHeight);
    } else if (REG_NUM.test(lineHeight)) {
      lineHeight = parseFloat(lineHeight) * this.fontSize;
    }
    return lineHeight as number;
  }

  public get opacity() {
    const opacity = parseFloat(this.style[styleKeywords.opacity]);
    return isNaN(opacity) ? 1 : opacity;
  }

  public get zIndex(): number {
    if (this.element.nodeType === NodeType.TEXT_NODE) {
      return this.element.parentNode!.style.zIndex;
    }
    const zIndex = parseInt(this.style[styleKeywords.zIndex]);
    return isNaN(zIndex) ? 0 : zIndex;
  }

  /**
   * 属性继承自任意父级
   */
  public get isNoWrap() {
    let element: Element | null = this.element;
    while (element) {
      const whiteSpace = element.style.get(styleKeywords.whiteSpace);
      if (whiteSpace) {
        if (whiteSpace === styleKeywords.nowrap) { // 强制不换行
          return true;
        } else {
          return false;
        }
      }
      element = element.parentNode;
    }
    return false;
  }

  public get clear() {
    return this.style[styleKeywords.clear];
  }

  public get overflow() {
    return this.style[styleKeywords.overflow];
  }

  public get isOverflow() {
    const {overflow} = this;
    return (overflow === styleKeywords.hidden || overflow === styleKeywords.auto);
  }

  public get isHidden() {
    return this.style[styleKeywords.display] === styleKeywords.none;
  }

  public get isAbsolute() {
    return this.style[styleKeywords.position] === styleKeywords.absolute;
  }

  public get isRelative(): boolean {
    if (this.element.nodeType === NodeType.TEXT_NODE) {
      return this.element.parentNode!.style.isRelative;
    }
    return this.style[styleKeywords.position] === styleKeywords.relative;
  }

  public get isFloat() {
    const float = this.style[styleKeywords.float];
    return float === styleKeywords.left || float === styleKeywords.right;
  }
}