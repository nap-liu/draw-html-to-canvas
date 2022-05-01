import * as path from 'path';
import {terser} from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
//

export default [
  {
    input: path.join(__dirname, 'src/index.ts'),
    plugins: [typescript()],
    output: {
      file: 'dist/index.js',
      format: 'cjs',
    },
  },
  {
    input: path.join(__dirname, 'src/index.ts'),
    plugins: [typescript()],
    output: {
      file: 'dist/index.min.js',
      format: 'cjs',
      plugins: [terser()],
    },
  },
  {
    input: path.join(__dirname, 'src/index.ts'),
    plugins: [typescript()],
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
    },
  },
  {
    input: path.join(__dirname, 'src/index.ts'),
    plugins: [typescript()],
    output: {
      file: 'dist/index.esm.min.js',
      format: 'esm',
      plugins: [terser()],
    },
  },
];