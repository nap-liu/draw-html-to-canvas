import parse from './parser';
import {SupportElement, SupportElementType} from './constants';
import ElementImage from './element-image';

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
    // TODO 优化图片资源加载逻辑
    await Promise.all(this.elements.map(async element => {
      const background = element.style.background;
      return Promise.all(background.filter(i => i.image).map(back => {
        const el = new ElementImage();
        el.attrs.src = back.image;
        return el.load().then(() => {
          element.style.imageMap[back.image] = el;
        });
      }))
    }));
    return Promise.all(this.elements.filter(i => i.nodeName === SupportElement.img).map((img: any) => (img as ElementImage).load()));
  }

  layout(context: CanvasRenderingContext2D) {
    return this.rootNode.layout(context);
  }

  draw(context: CanvasRenderingContext2D) {
    return this.rootNode.draw(context);
  }
}
