/* moduleRaid
 * https://github.com/pixeldesu/moduleRaid
 * 
 * Copyright pixeldesu and other contributors
 * Licensed under the MIT License
 * https://github.com/pixeldesu/moduleRaid/blob/master/LICENSE
 */

const moduleRaid = function () {
  mArr = [];

  getWebpackVersion = function() {
    switch(webpackJsonp.length) {
      case 2:
        return 1;
      case 3:
        return 2;
    }
  }

  fillModuleArray = function(mArr, version) {
    switch(version) {
      case 1:
        webpackJsonp([0], [function(e,t,i) {
          mCac = i.c;
          Object.keys(mCac).forEach(function(mod) {
            mArr[mod] = mCac[mod].exports;
          })
        }]);
        break;
      case 2:
        mEnd = false;
        mIter = 0;

        if (!webpackJsonp([],[],[mIter])) {
          throw 'Unknown Webpack structure';
        }
      
        while (!mEnd) {
          try {
            mArr[mIter] = webpackJsonp([],[],[mIter]);
            mIter++;
          }
          catch (err) {
            mEnd = true;
          }
        }
        break;
      default:
        throw 'Unknown Webpack version';
    }
  }

  fillModuleArray(mArr, getWebpackVersion())

  get = function get (id) {
    return mArr[id]
  }

  findModule = function findModule (query) {
    results = [];
    
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

    return results;
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