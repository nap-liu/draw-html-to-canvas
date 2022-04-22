import Element from './element';
import {NodeType} from './constants';

export default function parse(html: string) {
  let currentIndex = 0;
  let totalLength = html.length;
  let nodes = [];
  let stack = [];
  while (currentIndex < totalLength) {
    const char = html[currentIndex++];
    stack.push(char);

    if (stack.slice(0, 4).join('') === '<!--') {
      const end = html.indexOf('-->', currentIndex - 1);
      if (end === -1) {
        throw new Error('parse error comment end not found');
      }

      const comment = html.slice(currentIndex - stack.length, end + 3);
      nodes.push(comment);
      stack = [];
      currentIndex = end + 3;

      continue;
    }

    if (char === '<') { // 元素开始
      if (stack.length > 1) {
        stack.pop();
        nodes.push(stack.join(''));
        stack = [];
        stack.push(char);
      }
    } else if (char === '>') { // 元素结束
      nodes.push(stack.join(''));
      stack = [];
    }
  }

  if (stack.length) {
    nodes.push(stack.join(''))
  }

  let rootNode = new Element();
  let elements = [];
  rootNode.nodeType = NodeType.DOCUMENT_NODE;
  rootNode.nodeName = '#root';

  let parentNode: Element = rootNode;

  for (let contentText of nodes) {
    const currentNode = new Element();
    currentNode.root = rootNode;
    elements.push(currentNode);
    currentNode.nodeValue = contentText;
    currentNode.parentNode = parentNode;
    const last = parentNode.children[parentNode.children.length - 1];
    parentNode.children.push(currentNode);
    if (last) {
      last.nextNode = currentNode;
      currentNode.prevNode = last;
    }
    if (/^<!--/.test(contentText)) { // 注释
      currentNode.nodeType = NodeType.COMMENT_NODE;
      currentNode.nodeName = '#comment'
    } else if (/^<\//.test(contentText)) { // 结束标签
      parentNode.children.pop();
      elements.pop();
      if (last) {
        last.nextNode = null;
        currentNode.prevNode = null;
      }
      parentNode.endNode = currentNode;
      parentNode = parentNode.parentNode || rootNode;
    } else if (/^</.test(contentText)) { // 开始标签
      currentNode.nodeType = NodeType.ELEMENT_NODE;
      let matched = contentText.match(/<([\w-]+)\s?/);
      let nodeName = contentText;
      if (matched) {
        nodeName = matched[1];
      } else if (/^<!doctype/i.test(contentText)) {
        nodeName = 'html'
        currentNode.nodeType = NodeType.DOCUMENT_TYPE_NODE;
      }
      currentNode.nodeName = nodeName;
      const attrs = currentNode.attrs;

      contentText.replace(/([^\s]+)\s*=\s*('([^']+)'|"([^"]+)")?/g, (...args) => {
        const [, g1, , g3, g4] = args;
        attrs[g1] = g3 || g4 || '';
        return '';
      })

      for (let key in attrs) {
        switch (key) {
          case 'style': {
            const style = currentNode.style;
            (attrs[key] as string).replace(/\s*([^:]+)\s*:\s*([^;]+)\s*;?/g, (...args) => {
              const [, g1, g2] = args;
              style.set(g1, g2);
              return '';
            })
          }
            break;
        }
      }

      if (/br|hr|area|base|img|input|link|meta|basefont|param|col|frame|embed|keygen|source/i.test(nodeName) || /\/>$/.test(contentText)) {
        // 单标签不处理子父级关系
      } else {
        parentNode = currentNode;
      }
    } else { // 文字标签
      currentNode.nodeType = NodeType.TEXT_NODE;
      currentNode.nodeName = '#text'
    }
  }

  return {
    rootNode,
    elements,
  };
}
