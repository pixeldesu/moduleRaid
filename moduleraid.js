/* moduleRaid
 * https://github.com/pixeldesu/moduleRaid
 * 
 * Copyright pixeldesu and other contributors
 * Licensed under the MIT License
 * https://github.com/pixeldesu/moduleRaid/blob/master/LICENSE
 */

const moduleRaid = function () {
  moduleRaid.mObj = {};

  moduleRaid.args = [
    [[0], [function(e, t, i) {
      mCac = i.c;
      Object.keys(mCac).forEach(function(mod) {
        moduleRaid.mObj[mod] = mCac[mod].exports;
      })
    }]],
    [[], {'moduleraid': function(e, t, i) {
      mCac = i.c;
      Object.keys(mCac).forEach(function(mod) {
        moduleRaid.mObj[mod] = mCac[mod].exports;
      })
    }}, ['moduleraid']]
  ]

  fillModuleArray = function() {
    moduleRaid.args.forEach(function (argument) {
      webpackJsonp(...argument);
    })

    if (moduleRaid.mObj.length == 0) {
      mEnd = false;
      mIter = 0;

      if (!webpackJsonp([],[],[mIter])) {
        throw 'Unknown Webpack structure';
      }  

      while (!mEnd) {
        try {
          moduleRaid.mObj[mIter] = webpackJsonp([],[],[mIter]);
          mIter++;
        }
        catch (err) {
          mEnd = true;
        }
      }
    }
  }

  fillModuleArray()

  get = function get (id) {
    return moduleRaid.mObj[id]
  }

  findModule = function findModule (query) {
    results = [];
    modules = Object.keys(moduleRaid.mObj)
    
    modules.forEach(function(mKey) {
      mod = moduleRaid.mObj[mKey]

      if (typeof mod !== 'undefined') {
        if (typeof mod.default === "object") {
          for (key in mod.default) {
            if (key == query) results.push(mod);
          }
        }
  
        for (key in mod) {
          if (key == query) results.push(mod);
        }
      }
    })

    return results;
  }

  return { 
    modules: moduleRaid.mObj, 
    findModule: findModule, 
    get: get
  }
}

if (typeof module === 'object' && module.exports) {
  module.exports = moduleRaid;
} else {
  window.mR = moduleRaid();
}