import * as path from 'path';
import {terser} from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
//

export default [
  {
    input: path.join(__dirname, 'src/index.ts'),
    plugins: [
      typescript(),
      replace({
        'process.env.FULL_SUPPORT': 'true',
      }),
    ],
    output: [
      {
        file: 'dist/index.esm.js',
        format: 'esm',
      },
      {
        file: 'dist/index.esm.min.js',
        format: 'esm',
        plugins: [terser()],
      },
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
      },
      {
        file: 'dist/index.cjs.min.js',
        format: 'cjs',
        plugins: [terser()],
      },
      {
        file: 'dist/index.umd.js',
        name: 'DrawHtml2Canvas',
        format: 'umd',
      },
      {
        file: 'dist/index.umd.min.js',
        name: 'DrawHtml2Canvas',
        format: 'umd',
        plugins: [terser()],
      },
    ],
  },
  {
    input: path.join(__dirname, 'src/adapter/wx.ts'),
    plugins: [
      typescript(),
      replace({
        'process.env.FULL_SUPPORT': 'true',
      }),
    ],
    output: [
      {
        file: 'dist/wx.adapter.js',
        format: 'cjs',
      },
      {
        file: 'dist/wx.adapter.min.js',
        format: 'cjs',
        plugins: [terser()],
      },
    ],
  },
];