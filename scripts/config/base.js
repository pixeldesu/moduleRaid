import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default {
  plugins: [
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'bundled'
    }),
    terser()
  ]
}
