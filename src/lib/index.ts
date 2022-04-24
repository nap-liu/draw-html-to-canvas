import parse from './parser';
import {SupportElement, SupportElementType} from './constants';

export default class Render {
  static fromHTML(html: string) {
    return new Render(html);
  }

  rawHTML: string;
  rootNode: SupportElementType;
  elements: SupportElementType[];

  constructor(html: string) {
    this.rawHTML = html;
    const {elements, rootNode} = parse(html);
    this.rootNode = rootNode;
    this.elements = elements;
  }

  async loadSource() {
    return Promise.all(this.elements.filter(i => i.nodeName === SupportElement.img).map((img: any) => img.load()));
  }

  layout(context: CanvasRenderingContext2D) {
    return this.rootNode.layout(context);
  }

  draw(context: CanvasRenderingContext2D) {
    return this.rootNode.draw(context);
  }
}
