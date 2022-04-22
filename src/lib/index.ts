import parse from './parser';
import Element from './element';

export default class Render {
  static fromHTML(html: string) {
    return new Render(html);
  }

  rawHTML: string;
  rootNode: Element;
  elements: Element[];

  constructor(html: string) {
    this.rawHTML = html;
    const {elements, rootNode} = parse(html);
    this.rootNode = rootNode;
    this.elements = elements;
  }

  layout(context: CanvasRenderingContext2D) {
    return this.rootNode.layout(context);
  }

  draw(context: CanvasRenderingContext2D) {
    return this.rootNode.draw(context);
  }
}
