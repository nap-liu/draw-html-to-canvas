import type ElementImage from './element-image';
import type Element from './element';
import {values} from './util';

export const styleKeywords = {
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
  'vertical-align': '',
  'white-space': '',
  absolute: '',
  relative: '',
  float: '',
  align: '',
  center: '',
}

Object.keys(styleKeywords).forEach(i => {
  // @ts-ignore
  styleKeywords[i] = i;
})

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

// export enum NodeType {
//   ELEMENT_NODE = 'ELEMENT_NODE', //	一个 元素 节点，例如 <p> 和 <div>。
//   TEXT_NODE = 'TEXT_NODE', //	Element 或者 Attr 中实际的文字
//   CDATA_SECTION_NODE = 'CDATA_SECTION_NODE', //	一个 CDATASection，例如 <!CDATA[[ … ]]>。
//   PROCESSING_INSTRUCTION_NODE = 'PROCESSING_INSTRUCTION_NODE', //	一个用于XML文档的 ProcessingInstruction (en-US) ，例如 <?xml-stylesheet ... ?> 声明。
//   COMMENT_NODE = 'COMMENT_NODE', //	一个 Comment 节点。
//   DOCUMENT_NODE = 'DOCUMENT_NODE', //	一个 Document 节点。
//   DOCUMENT_TYPE_NODE = 'DOCUMENT_TYPE_NODE', //	描述文档类型的 DocumentType 节点。例如 <!DOCTYPE html>  就是用于 HTML5 的。
//   DOCUMENT_FRAGMENT_NODE = 'DOCUMENT_FRAGMENT_NODE', //	一个 DocumentFragment 节点
// }

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

const COLOR = `rgba\\(\\s*(?:\\d{1,3}\\s*,\\s*){3}\\s*(?:\\d|\\.\\d+|\\d\\.\\d+)\\s*\\)|rgb\\(\\s*(?:\\d{1,3}\\s*,\\s*){3}\\s*\\)|(?:#[a-z0-9]{6})|(?:#[a-z0-9]{3})`
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
const BG_POS = `(?:(left|center|right|top|bottom)\\s+${FLOAT}?)`
const BG_SIZE_ENUM = '(cover|contain)'
const BG_SIZE_NUM = `(auto|${FLOAT_NO_GROUP})`
const BG_SIZE = `(?:${BG_SIZE_ENUM}|(?:${BG_SIZE_NUM}(?:\\s+${BG_SIZE_NUM})?))`

export const REG_BG_POSITION = new RegExp(`(${BG_POS}|${FLOAT})\\s*(${BG_POS}|${FLOAT})?`, 'i')
export const REG_BG_SIZE = new RegExp(BG_SIZE, 'i');
// console.log(REG_BG_SIZE);
export const REG_BG_POSITION_SIZE = new RegExp(`\\s*(${BG_POS}|${FLOAT})\\s*(${BG_POS}|${FLOAT})?(?:\\s*\\/\\s*${BG_SIZE})`, 'i');

// console.log(REG_BG_POSITION_SIZE);

const getRound = (value: string) => `((?:(${value})\\s+(${value})\\s+(${value})\\s+(${value}))|(?:(${value})\\s+(${value})\\s+(${value}))|(?:(${value})\\s+(${value}))|(${value}))`;

export const REG_ROUND_AUTO_VALUE = new RegExp(getRound(`auto|${FLOAT_NO_GROUP}`), 'i');
// console.log('REG_ROUND_AUTO_VALUE', REG_ROUND_AUTO_VALUE);

const ROUND_NUM = getRound(FLOAT_POSITIVE_NO_GROUP);
export const REG_BORDER_RADIUS = new RegExp(`(?:${ROUND_NUM}(?:\\s*/\\s*${ROUND_NUM})?)`, 'i')
// console.log('REG_BORDER_RADIUS', REG_BORDER_RADIUS);

// console.log('REG_ROUND_VALUE',REG_ROUND_VALUE);
// console.log('REG_ROUND_AUTO_VALUE',REG_ROUND_AUTO_VALUE);

const BORDER_STYLE = '(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)';
const BORDER_WIDTH = `((?:thin|medium|thick)|(?:${FLOAT_POSITIVE_NO_GROUP}))`

export const REG_BORDER_WIDTH = new RegExp(BORDER_WIDTH, 'i');
export const REG_BORDER_STYLE = new RegExp(BORDER_STYLE, 'i');
export const REG_BORDER_COLOR = REG_COLOR;
export const REG_BORDER = new RegExp(`${BORDER_WIDTH}\\s+${BORDER_STYLE}\\s+(${COLOR})`, 'i')

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
export const REG_TEXT_DECORATION_THICKNESS = new RegExp(FLOAT_POSITIVE_NO_GROUP, 'i');

// console.log(REG_BORDER);

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

export type TContinueDraw = (ctx: CanvasRenderingContext2D) => void;
export type TCurvePath = [[number, number], [number, number], [number, number]];