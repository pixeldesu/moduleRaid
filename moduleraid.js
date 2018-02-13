/* moduleRaid
 * https://github.com/pixeldesu/moduleRaid
 * 
 * Copyright pixeldesu and other contributors
 * Licensed under the MIT License
 * https://github.com/pixeldesu/moduleRaid/blob/master/LICENSE
 */

const moduleRaid = function () {
  moduleRaid.mObj = {};
  moduleRaid.cArr = [];

  moduleRaid.args = [
    [[0], [function(e, t, i) {
      mCac = i.c;
      Object.keys(mCac).forEach (function(mod) {
        moduleRaid.mObj[mod] = mCac[mod].exports;
      })
      moduleRaid.cArr = i.m;
    }]],
    [[], {'moduleraid': function(e, t, i) {
      mCac = i.c;
      Object.keys(mCac).forEach (function(mod) {
        moduleRaid.mObj[mod] = mCac[mod].exports;
      })
      moduleRaid.cArr = i.m;
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
        throw Error("Unknown Webpack structure");
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
    modules = Object.keys(moduleRaid.mObj);
    
    modules.forEach(function(mKey) {
      mod = moduleRaid.mObj[mKey];

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

  findFunction = function(query) {
    if (moduleRaid.cArr.length == 0) {
      throw Error("No module constructors to search through!");
    }

    results = [];

    if (typeof query === "string") {
      moduleRaid.cArr.forEach(function (ctor, index) { 
        if (ctor.toString().includes(query)) { 
          results.push(moduleRaid.mObj[index]);
        }
      })
    } else if (typeof query === "function") {
      modules = Object.keys(moduleRaid.mObj);

      modules.forEach(function(mKey, index) {
        mod = moduleRaid.mObj[mKey];

        if (query(mod)) {
          results.push(moduleRaid.mObj[index]);
        }
      })
    } else { 
      throw new TypeError('findFunction can only find via string and function, ' + (typeof query) + ' was passed');
    }

    return results;
  }

  return {
    modules: moduleRaid.mObj,
    constructors: moduleRaid.cArr,
    findModule: findModule,
    findFunction: findFunction,
    get: get
  }
}

if (typeof module === 'object' && module.exports) {
  module.exports = moduleRaid;
} else {
  window.mR = moduleRaid();
}