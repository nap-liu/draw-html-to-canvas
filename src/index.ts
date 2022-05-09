import parse from './parser';
import {SupportElement, SupportElementType} from './constants';
import ElementImage from './element-image';

export interface IOption {
  debug: boolean;
}

export default class Render {
  static fromHTML(html: string, option: IOption) {
    return new Render(html, option);
  }

  rawHTML: string;
  rootNode: SupportElementType;
  elements: SupportElementType[];

  constructor(html: string, option: IOption = {debug: false}) {
    this.rawHTML = html;
    const {elements, rootNode} = parse(html);
    this.rootNode = rootNode;
    this.elements = elements;
    this.rootNode.debug = option.debug;
  }

  loadSource(canvas?: HTMLCanvasElement) {
    // TODO 优化图片资源加载逻辑
    return Promise.all(this.elements.map(element => {
      const background = element.style.background;
      return Promise.all(background.filter(i => i.image).map(back => {
        const el = new ElementImage();
        el.root = this.rootNode;
        el.attrs.src = back.image;
        return el.load(canvas).then(() => {
          element.style.imageMap[back.image] = el;
        });
      }))
    })).then(() => {
      return Promise.all(this.elements.filter(i => i.nodeName === SupportElement.img).map((img: any) => (img as ElementImage).load(canvas)));
    });
  }

  layout(context: CanvasRenderingContext2D) {
    this.elements.forEach(i => i.updateCache());
    return this.rootNode.layout(context);
  }

  draw(context: CanvasRenderingContext2D) {
    return this.rootNode.draw(context);
  }
}

export {ElementImage};
