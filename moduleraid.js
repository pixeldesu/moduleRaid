/* moduleRaid
 * https://github.com/pixeldesu/moduleRaid
 * 
 * Copyright pixeldesu and other contributors
 * Licensed under the MIT License
 * https://github.com/pixeldesu/moduleRaid/blob/master/LICENSE
 */

const moduleRaid = function () {
  mArr = [];

  mEnd = false;
  mIter = 0;

  while (!mEnd) {
    try {
      mArr[mIter] = webpackJsonp([],[],[mIter]);
      mIter++;
    }
    catch (err) {
      mEnd = true
    }
  }

  get = function get (id) {
    return mArr[id]
  }

  findModule = function findModule (query) {
    results = []
    
    mArr.forEach(function(mod) {
      if (typeof mod.default === "object") {
        for (key in mod.default) {
          if (key == query) results.push(mod);
        }
      }

      for (key in mod) {
        if (key == query) results.push(mod);
      }
    })

    return results
  }

  return { 
    modules: mArr, 
    findModule: findModule, 
    get: get
  }
}

if (typeof module === 'object' && module.exports) {
  module.exports = moduleRaid;
} else {
  window.mR = moduleRaid();
}