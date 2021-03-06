import type ElementImage from './element-image';
import type Element from './element';
import {makeMap, values} from './util';

const originKeyList = {
  inherit: '',
  initial: '',
  auto: '',
  color: '',
  font: '',
  style: '',
  variant: '',
  weight: '',
  stretch: '',
  family: '',
  top: '',
  right: '',
  bottom: '',
  left: '',
  size: '',
  line: '',
  text: '',
  decoration: '',
  none: '',
  background: '',
  image: '',
  position: '',
  repeat: '',
  clip: '',
  origin: '',
  width: '',
  height: '',
  padding: '',
  margin: '',
  border: '',
  radius: '',
  display: '',
  absolute: '',
  relative: '',
  float: '',
  align: '',
  center: '',
  clear: '',
  overflow: '',
  hidden: '',
  visible: '',
  opacity: '',
  thickness: '',
  nowrap: '',
};

const keyList = makeMap<typeof originKeyList>(originKeyList);

const originStyleKeywords = {
  ...keyList,
  'vertical-align': '',
  'white-space': '',
  'z-index': '',

  [`${keyList.font}-${keyList.style}`]: '',
  [`${keyList.font}-${keyList.variant}`]: '',
  [`${keyList.font}-${keyList.weight}`]: '',
  [`${keyList.font}-${keyList.stretch}`]: '',
  [`${keyList.font}-${keyList.size}`]: '',
  [`${keyList.font}-${keyList.family}`]: '',
  [`${keyList.line}-${keyList.height}`]: '',

  [`${keyList.text}-${keyList.decoration}`]: '',
  // TODO 优先级支持
  [`${keyList.text}-${keyList.decoration}-${keyList.color}`]: '',
  [`${keyList.text}-${keyList.decoration}-${keyList.style}`]: '',
  [`${keyList.text}-${keyList.decoration}-${keyList.thickness}`]: '',
  [`${keyList.text}-${keyList.decoration}-${keyList.line}`]: '',

  [`${keyList.background}-${keyList.image}`]: '',
  [`${keyList.background}-${keyList.color}`]: '',
  [`${keyList.background}-${keyList.position}`]: '',
  [`${keyList.background}-${keyList.size}`]: '',
  [`${keyList.background}-${keyList.repeat}`]: '',
  [`${keyList.background}-${keyList.clip}`]: '',
  [`${keyList.background}-${keyList.origin}`]: '',

  [`${keyList.border}-${keyList.top}`]: '',
  [`${keyList.border}-${keyList.right}`]: '',
  [`${keyList.border}-${keyList.bottom}`]: '',
  [`${keyList.border}-${keyList.left}`]: '',

  [`${keyList.border}-${keyList.top}-${keyList.width}`]: '',
  [`${keyList.border}-${keyList.right}-${keyList.width}`]: '',
  [`${keyList.border}-${keyList.bottom}-${keyList.width}`]: '',
  [`${keyList.border}-${keyList.left}-${keyList.width}`]: '',

  [`${keyList.border}-${keyList.top}-${keyList.style}`]: '',
  [`${keyList.border}-${keyList.right}-${keyList.style}`]: '',
  [`${keyList.border}-${keyList.bottom}-${keyList.style}`]: '',
  [`${keyList.border}-${keyList.left}-${keyList.style}`]: '',

  [`${keyList.border}-${keyList.top}-${keyList.color}`]: '',
  [`${keyList.border}-${keyList.right}-${keyList.color}`]: '',
  [`${keyList.border}-${keyList.bottom}-${keyList.color}`]: '',
  [`${keyList.border}-${keyList.left}-${keyList.color}`]: '',

  [`${keyList.border}-${keyList.radius}`]: '',
  [`${keyList.border}-${keyList.top}-${keyList.left}-${keyList.radius}`]: '',
  [`${keyList.border}-${keyList.top}-${keyList.right}-${keyList.radius}`]: '',
  [`${keyList.border}-${keyList.bottom}-${keyList.right}-${keyList.radius}`]: '',
  [`${keyList.border}-${keyList.bottom}-${keyList.left}-${keyList.radius}`]: '',
};

export const styleKeywords: {
  [x: string]: string;
} & typeof keyList & typeof originStyleKeywords = makeMap<typeof originStyleKeywords>(originStyleKeywords);

// console.log(styleKeywords);

export const DEFAULT_FONT_FAMILY = 'sans-serif';
export const DEFAULT_FONT_SIZE = '16px';
export const DEFAULT_COLOR = '#000';
export const DEFAULT_VERTICAL_ALIGN = styleKeywords.top;
export const DEFAULT_LINE_HEIGHT = '1.2';

export enum NodeType {
  ELEMENT_NODE = 1, //	一个 元素 节点，例如 <p> 和 <div>。
  TEXT_NODE = 3, //	Element 或者 Attr 中实际的文字
  CDATA_SECTION_NODE = 4, //	一个 CDATASection，例如 <!CDATA[[ … ]]>。
  PROCESSING_INSTRUCTION_NODE = 7, //	一个用于XML文档的 ProcessingInstruction (en-US) ，例如 <?xml-stylesheet ... ?> 声明。
  COMMENT_NODE = 8, //	一个 Comment 节点。
  DOCUMENT_NODE = 9, //	一个 Document 节点。
  DOCUMENT_TYPE_NODE = 10, //	描述文档类型的 DocumentType 节点。例如 <!DOCTYPE html>  就是用于 HTML5 的。
  DOCUMENT_FRAGMENT_NODE = 11, //	一个 DocumentFragment 节点
}

export enum BlockType {
  block = 'block',
  inline = 'inline',
  inlineBlock = 'inline-block',
  flex = 'flex',
  none = 'none',
}

export enum SupportElement {
  div = 'div',
  img = 'img',
  br = 'br',
  hr = 'hr',
  span = 'span',
}

const COLOR = `rgba\\(\\s*(?:\\d{1,3}\\s*,\\s*){3}\\s*(?:\\d|\\.\\d+|\\d\\.\\d+)\\s*\\)|rgb\\(\\s*(?:\\d{1,3}\\s*,\\s*){3}\\s*\\)|(?:#[a-z0-9]{6})|(?:#[a-z0-9]{3})|transparent|currentColor`
export const REG_COLOR = new RegExp(COLOR, 'i');
export const REG_PX = /px$/i;
export const REG_PCT = /%$/;
export const REG_REM = /rem$/i;
export const REG_EM = /em$/i;
export const REG_NUM = /^\d+(?:.\d+)?$/;
export const REG_URL = /url\((?:'([^']+)'|("[^"]+")|([^)]+))\)/i;
export const REG_BG_REPEAT = /repeat-y|repeat-x|no-repeat|repeat/i;
export const REG_BG_ATTACHMENT = /scroll|fixed|local/i;
export const REG_BG_CLIP = /border-box|padding-box|content-box/ig;

const FLOAT_NO_GROUP = '(?:-?\\d*(?:\\.\\d+)?)(?:%|px)?'
const FLOAT_POSITIVE_NO_GROUP = '(?:\\d*(?:\\.\\d+)?)(?:%|px)?'
const FLOAT = `(${FLOAT_NO_GROUP})`
const BG_POS_ENUM = 'left|center|right|top|bottom'
const BG_POS_ENUM_GROUP = `(${BG_POS_ENUM})`
const BG_POS = `(?:(${BG_POS_ENUM})\\s+${FLOAT}?)`
const BG_SIZE_ENUM = '(cover|contain)'
const BG_SIZE_NUM = `(auto|${FLOAT_NO_GROUP})`
const BG_SIZE = `(?:${BG_SIZE_ENUM}|(?:${BG_SIZE_NUM}(?:\\s+${BG_SIZE_NUM})?))`

export const REG_BG_POS_ENUM = new RegExp(BG_POS_ENUM, 'i');
export const REG_POS_LR = /left|right/;
export const REG_POS_TB = /top|bottom/;

export const REG_BG_POSITION = new RegExp(`(?:${BG_POS_ENUM_GROUP}\\s+${FLOAT}\\s+${BG_POS_ENUM_GROUP}\\s+${FLOAT})|(?:${BG_POS_ENUM_GROUP}\\s+((?:${BG_POS_ENUM})|${FLOAT_NO_GROUP})\\s+((?:${BG_POS_ENUM})|${FLOAT_NO_GROUP}))|(?:(?:${BG_POS_ENUM_GROUP}|${FLOAT})\\s+(?:${BG_POS_ENUM_GROUP}|${FLOAT}))|(?:${BG_POS_ENUM_GROUP}|${FLOAT})`, 'i')

export const REG_BG_SIZE = new RegExp(BG_SIZE, 'i');
// console.log(REG_BG_POSITION);

export const REG_BG_POSITION_SIZE = new RegExp(`\\s*(${BG_POS}|${FLOAT})(?:\\s*(${BG_POS}|${FLOAT}))?(?:\\s*\\/\\s*${BG_SIZE})`, 'i');

// console.log(REG_BG_POSITION_SIZE);

const getRound = (value: string) => `((?:(${value})\\s+(${value})\\s+(${value})\\s+(${value}))|(?:(${value})\\s+(${value})\\s+(${value}))|(?:(${value})\\s+(${value}))|(${value}))`;

export const REG_ROUND_AUTO_VALUE = new RegExp(getRound(`auto|${FLOAT_NO_GROUP}`), 'i');
// console.log('REG_ROUND_AUTO_VALUE', REG_ROUND_AUTO_VALUE);

const ROUND_NUM = getRound(FLOAT_POSITIVE_NO_GROUP);
export const REG_BORDER_RADIUS = new RegExp(`(?:${ROUND_NUM}(?:\\s*/\\s*${ROUND_NUM})?)`, 'i')
export const REG_RADIUS_VALUE = new RegExp(`(${FLOAT_POSITIVE_NO_GROUP})(?:\\s+(${FLOAT_POSITIVE_NO_GROUP}))?`, 'i');
// console.log('REG_BORDER_RADIUS', REG_BORDER_RADIUS);
// console.log('REG_RADIUS_VALUE', REG_RADIUS_VALUE);

// console.log('REG_ROUND_VALUE',REG_ROUND_VALUE);
// console.log('REG_ROUND_AUTO_VALUE',REG_ROUND_AUTO_VALUE);

export enum BORDER_STYLE {
  none = 'none',
  hidden = 'hidden',
  dotted = 'dotted',
  dashed = 'dashed',
  solid = 'solid',
  double = 'double',
  ridge = 'ridge',
  inset = 'inset',
  outset = 'outset',
}

const REG_STR_BORDER_STYLE = `(${values(BORDER_STYLE).join('|')})`;
const BORDER_WIDTH = `((?:thin|medium|thick)|(?:${FLOAT_POSITIVE_NO_GROUP}))`

export const REG_BORDER_WIDTH = new RegExp(BORDER_WIDTH, 'i');
export const REG_BORDER_STYLE = new RegExp(REG_STR_BORDER_STYLE, 'i');
export const REG_BORDER_COLOR = REG_COLOR;
export const REG_BORDER = new RegExp(`${BORDER_WIDTH}\\s+${REG_STR_BORDER_STYLE}\\s+(${COLOR})`, 'i')

// console.log('REG_BORDER', REG_BORDER)
// console.log('REG_BORDER_STYLE', REG_BORDER_STYLE);

export enum TEXT_DECORATION_LINE {
  none = 'none',
  underline = 'underline',
  overline = 'overline',
  lineThrough = 'line-through',
}

export enum TEXT_DECORATION_STYLE {
  solid = 'solid',
  double = 'double',
  dotted = 'dotted',
  dashed = 'dashed',
  wavy = 'wavy'
}

export const REG_TEXT_DECORATION_STYLE = new RegExp(`${values(TEXT_DECORATION_STYLE).join('|')}`, 'i');
export const REG_TEXT_DECORATION_LINE = new RegExp(`${values(TEXT_DECORATION_LINE).join('|')}`, 'ig');
export const REG_TEXT_DECORATION_COLOR = REG_COLOR;
export const REG_TEXT_DECORATION_THICKNESS = new RegExp(FLOAT_POSITIVE_NO_GROUP.slice(0, -1), 'i');

export const REG_GRADIENT_TYPE = /((?:repeating-)?(?:linear|radial)-gradient)/i;
export const REG_GRADIENT_DIRECTION = /((?:repeating-)?(?:linear|radial)-gradient)\s*\(\s*((?:to\s+(top|bottom)\s+(left|right)|to\s+(left|right)\s+(top|bottom)|to\s+(top|bottom)|to\s+(left|right)|(-?\d+(?:\.?\d+)?(?:deg)?)))?/i;
export const REG_GRADIENT_COLOR_SIZE = new RegExp(`(${COLOR})(\\s+${FLOAT_NO_GROUP})?`, 'gi')
// console.log('REG_GRADIENT_TYPE', REG_GRADIENT_TYPE);
// console.log('REG_GRADIENT_DIRECTION', REG_GRADIENT_DIRECTION);
// console.log('REG_GRADIENT_COLOR_SIZE', REG_GRADIENT_COLOR_SIZE);

export const REG_ELEMENT_ATTR = /([^\s]+)\s*=\s*('([^']+)'|"([^"]+)"|([^=<>"']))?/gi;
export const REG_STYLE_ATTR = /\s*([^:]+)\s*:\s*([^;]+)\s*;?/gi

export const REG_SINGLE_ELEMENT = /br|hr|area|base|img|input|link|meta|basefont|param|col|frame|embed|keygen|source/gi
export const URL_HOLD = '#__URL__#';
export const REG_URL_HOLD = new RegExp(URL_HOLD, 'g');

export enum GradientType {
  repeatingLinearGradient = 'repeating-linear-gradient',
  repeatingRadialGradient = 'repeating-radial-gradient',
  linearGradient = 'linear-gradient',
  radialGradient = 'radial-gradient',
}

export type SupportElementType = Element | ElementImage;

export enum BackgroundPosition {
  left = 'left',
  center = 'center',
  right = 'right',
  top = 'top',
  bottom = 'bottom',
}

export enum BackgroundSize {
  auto = 'auto',
  cover = 'cover',
  contain = 'contain',
}

export enum BackgroundRepeat {
  repeat = 'repeat',
  noRepeat = 'no-repeat',
  repeatX = 'repeat-x',
  repeatY = 'repeat-y',
}

export enum BackgroundClip {
  borderBox = 'border-box',
  paddingBox = 'padding-box',
  contentBox = 'content-box',
}

export enum BackgroundAttachment {
  scroll = 'scroll',
  fixed = 'fixed',
  local = 'local',
}

export enum TextAlign {
  left = 'left',
  center = 'center',
  right = 'right',
}

export type TContinueDraw = (ctx: CanvasRenderingContext2D, ...args: any) => void;
export type TQuadraticCurvePath = [[number, number], [number, number], [number, number]];
export type TBezierCurvePath = [[number, number], [number, number], [number, number], [number, number]];