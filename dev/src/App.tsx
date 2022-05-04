import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import defaultHtml, {html2, html3} from './html';
import Render from './sources';
import debounce from './debounce';

const html = defaultHtml;
// const html = html2;
// const html = html3;

export default function App() {
  const div = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(2);
  useLayoutEffect(() => {
    console.time('Render.fromHTML(html)');
    const render = Render.fromHTML(html, {
      debug: false,
    });
    console.timeEnd('Render.fromHTML(html)');
    let context: CanvasRenderingContext2D;
    const onResize: any = debounce(() => {
      if (render.rootNode && context) {
        context.save();
        const width = document.body.clientWidth;
        console.log('resize', width);
        context.clearRect(0, 0, render.rootNode.offsetWidth, render.rootNode.offsetHeight);
        console.time('render.layout(context)');
        render.rootNode.style.set('width', `${width}px`);
        // render.rootNode.style.set('overflow', `hidden`);
        // render.rootNode.style.set('width', `434px`);
        render.layout(context);
        console.timeEnd('render.layout(context)');
        console.time('render.draw(context)');
        const {offsetWidth, offsetHeight} = render.rootNode;
        canvas.current!.height = offsetHeight * scale;
        canvas.current!.width = offsetWidth * scale;
        console.log('offsetWidth', offsetWidth, 'offsetHeight', offsetHeight);
        context.scale(scale, scale);
        render.draw(context);
        console.timeEnd('render.draw(context)');
        context.restore();
        console.log(render);
      }
    }, 300);

    ;(async () => {
      if (div.current && canvas.current) {
        // @ts-ignore
        context = canvas.current.getContext('2d')
        console.time('Render.loadSource()');
        await render.loadSource();
        console.time('Render.loadSource()');

        if (context) {
          onResize();
        }
        console.log(render);
        // @ts-ignore
        window.render = render;
      }
    })();

    window.addEventListener('resize', onResize);
    console.log('append');
    return () => {
      console.log('removed');
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      <div ref={div} dangerouslySetInnerHTML={{__html: html}} />
      <canvas
        ref={canvas}
        // width={1000}
        // height={2000}
        style={{border: '1px solid #f00', width: '100%', height: '100%'}}
      />
    </>
  );
}