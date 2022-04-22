export const DEFAULT_FONT_FAMILY = 'sans-serif';
export const DEFAULT_FONT_SIZE = '16px';
export const DEFAULT_COLOR = '#000';
export const DEFAULT_LINE_HEIGHT = '1.5';

// export enum NodeType {
//   ELEMENT_NODE = 1, //	一个 元素 节点，例如 <p> 和 <div>。
//   TEXT_NODE = 3, //	Element 或者 Attr 中实际的文字
//   CDATA_SECTION_NODE = 4, //	一个 CDATASection，例如 <!CDATA[[ … ]]>。
//   PROCESSING_INSTRUCTION_NODE = 7, //	一个用于XML文档的 ProcessingInstruction (en-US) ，例如 <?xml-stylesheet ... ?> 声明。
//   COMMENT_NODE = 8, //	一个 Comment 节点。
//   DOCUMENT_NODE = 9, //	一个 Document 节点。
//   DOCUMENT_TYPE_NODE = 10, //	描述文档类型的 DocumentType 节点。例如 <!DOCTYPE html>  就是用于 HTML5 的。
//   DOCUMENT_FRAGMENT_NODE = 11, //	一个 DocumentFragment 节点
// }

export enum NodeType {
  ELEMENT_NODE = 'ELEMENT_NODE', //	一个 元素 节点，例如 <p> 和 <div>。
  TEXT_NODE = 'TEXT_NODE', //	Element 或者 Attr 中实际的文字
  CDATA_SECTION_NODE = 'CDATA_SECTION_NODE', //	一个 CDATASection，例如 <!CDATA[[ … ]]>。
  PROCESSING_INSTRUCTION_NODE = 'PROCESSING_INSTRUCTION_NODE', //	一个用于XML文档的 ProcessingInstruction (en-US) ，例如 <?xml-stylesheet ... ?> 声明。
  COMMENT_NODE = 'COMMENT_NODE', //	一个 Comment 节点。
  DOCUMENT_NODE = 'DOCUMENT_NODE', //	一个 Document 节点。
  DOCUMENT_TYPE_NODE = 'DOCUMENT_TYPE_NODE', //	描述文档类型的 DocumentType 节点。例如 <!DOCTYPE html>  就是用于 HTML5 的。
  DOCUMENT_FRAGMENT_NODE = 'DOCUMENT_FRAGMENT_NODE', //	一个 DocumentFragment 节点
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

