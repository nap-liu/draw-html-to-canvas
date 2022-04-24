import React, {useEffect, useLayoutEffect, useRef} from 'react';
import html from './html';
import Render from './lib';

const scale = 1.5;
export default function App() {
  const div = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    if (div.current && canvas.current) {
      console.time('Render.fromHTML(html)');
      const render = Render.fromHTML(html);
      console.timeEnd('Render.fromHTML(html)');
      const context = canvas.current.getContext('2d');
      const rect = canvas.current.getBoundingClientRect();
      if (context) {
        context.clearRect(0, 0, rect.width * scale, rect.height * scale)
        context.scale(scale, scale);
        console.time('render.layout(context)');
        render.rootNode.style.set('width', '500px');
        render.layout(context);
        console.timeEnd('render.layout(context)');

        console.time('render.draw(context)');
        render.draw(context);
        console.timeEnd('render.draw(context)');
      }
      console.log(render);
      // @ts-ignore
      window.render = render;
    }
  });
  const size = 1200
  return (
    <>
      <div ref={div} dangerouslySetInnerHTML={{__html: html}} />
      <canvas
        ref={canvas}
        width={size}
        height={size * 2}
        style={{width: '100%', height: '100%', boxSizing: 'border-box', border: '1px solid #f00'}}
      />
    </>
  );
}