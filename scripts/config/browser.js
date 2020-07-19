import pkg from '../../package.json';

export default {
  input: 'src/index.browser.js',
  output: {
    file: pkg.browser,
    format: 'iife'
  }
}
