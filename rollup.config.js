import * as path from 'path';
import {terser} from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

const isBuild = process.env.NODE_ENV === 'production';
const isDevWX = process.env.NODE_ENV === 'weixin';

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
      ...(isBuild ? [
        {
          file: 'dist/index.esm.js',
          format: 'esm',
        },
        {
          file: 'example/weixin/lib/index.esm.min.js',
          format: 'esm',
          plugins: [terser()],
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
      ] : []),
      ...(isDevWX ? [
        {
          file: 'example/weixin/lib/index.esm.js',
          format: 'esm',
        },
      ] : []),
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
      ...(isBuild ? [
        {
          file: 'dist/wx.adapter.js',
          format: 'cjs',
        },
        {
          file: 'dist/wx.adapter.min.js',
          format: 'cjs',
          plugins: [terser()],
        },
        {
          file: 'example/weixin/lib/wx.adapter.min.js',
          format: 'cjs',
          plugins: [terser()],
        },
      ] : []),
      ...(isDevWX ? [
        {
          file: 'example/weixin/lib/wx.adapter.js',
          format: 'cjs',
        },
      ] : []),
    ],
  },
  {
    input: path.join(__dirname, 'example/html.ts'),
    plugins: [
      typescript(),
    ],
    output: [
      ...(isBuild ? [
        {
          file: 'dev/src/html.demo.js',
          format: 'cjs',
        },
        {
          file: 'example/browser/html.js',
          format: 'umd',
          name: 'html',
        },
        {
          file: 'example/weixin/index/html.js',
          format: 'cjs',
        },
      ] : []),
      ...(isDevWX ? [
        {
          file: 'example/weixin/index/html.js',
          format: 'cjs',
        },
      ] : []),
    ],
  },
];