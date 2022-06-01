import {BlockType, NodeType} from './constants';
import Style from './style';
import Line from './line';
import LineManger from './line-manger';
import {applyMixins} from './util';
import Draw from './draw';
import Layout from './layout';

interface Element extends Draw, Layout {}

class Element {
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

  // @ts-ignore
  public textMetric: { lineHeight: number; width: number };

  public lines = new LineManger(this);
  public line: Line | null = null;
  public lineElement: Element | null = null;

  public debug = false;

  // public blockType: BlockType;
  // public displayText: string;

  public updateCache() {
    // this.blockType = this._blockType;
    // this.displayText = this._displayText;
    this.style.updateCache();
  }

  public clone() {
    const e = new Element();
    Object.assign(e, this);
    e.shadow = this;
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

  public isInlineORInlineBlock(item: Element) {
    return [BlockType.inline, BlockType.inlineBlock].includes(item.blockType);
  }

  /**
   * 显示文字 处理换行问题
   */
  public get displayText() {
    const text = this.nodeValue.replace(/\s+/g, ' ');
    return text === ' ' ? '' : text.trim();
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
    const {margin, padding, border, isBorderBox} = this.style;
    if (blockType === BlockType.block || blockType === BlockType.inlineBlock) {
      return this.contentWidth + margin.left + margin.right + (isBorderBox ? 0 : (border.left.width + border.right.width + padding.left + padding.right));
    } else if (blockType === BlockType.inline) {
      return this.contentWidth + border.left.width + border.right.width + padding.left + padding.right;
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
    const {margin, padding, border, isBorderBox} = this.style;
    if (blockType === BlockType.block || blockType === BlockType.inlineBlock) {
      return this.contentHeight + margin.top + margin.bottom + (isBorderBox ? 0 : (border.top.width + border.bottom.width + padding.top + padding.bottom));
    } else if (blockType === BlockType.inline) {
      return this.contentHeight;
    }
    return 0;
  };

  /**
   * 相对于页面的left
   */
  public get offsetLeft(): number {
    if (this.lineElement) {
      return this.lineElement.offsetLeft + this.left;
    }
    return this.left;
  }

  /**
   * 相对于页面的top
   */
  public get offsetTop(): number {
    if (this.lineElement) {
      return this.lineElement.offsetTop + this.top;
    }
    return this.top;
  }

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

  public getTextMetrics(context: CanvasRenderingContext2D, text: string) {
    const {canvasFont, lineHeight} = this.style;
    // TODO letter-spacing 支持
    context.font = canvasFont;
    const textMetrics = context.measureText(text);
    // let fontHeight = textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent;
    // let fontHeight = NaN;
    // if (isNaN(fontHeight)) {
    //   // 兼容不支持测量文字基线的canvas
    //   fontHeight = this.style.fontSize;
    // }
    return {
      width: textMetrics.width,
      lineHeight,
    };
  }
}

applyMixins(Element, [Draw, Layout]);

export default Element;