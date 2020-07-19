import merge from 'deepmerge';

import base from './scripts/config/base';
import node from './scripts/config/node';
import browser from './scripts/config/browser';

export default [
  merge(base, browser),
  merge(base, node)
];
