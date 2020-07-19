/* moduleRaid
 * https://github.com/pixeldesu/moduleRaid
 *
 * Copyright pixeldesu and other contributors
 * Licensed under the MIT License
 * https://github.com/pixeldesu/moduleRaid/blob/master/LICENSE
 */

export function moduleRaid (debug) {
  moduleRaid.mID  = Math.random().toString(36).substring(7);
  moduleRaid.mObj = {};
  moduleRaid.cArr = [];
  moduleRaid.mGet = null;

  if (debug) {
    moduleRaid.debug = true;
  } else if (window.mRdebug) {
    moduleRaid.debug = true;
  } else {
    moduleRaid.debug = false;
  }

  moduleRaid.log = (message) => {
    if (moduleRaid.debug) {
      console.warn(`[moduleRaid] ${message}`);
    }
  };

  moduleRaid.args = [
    [[0], [(e, t, i) => {
      mCac = i.c;
      Object.keys(mCac).forEach ((mod) => {
        moduleRaid.mObj[mod] = mCac[mod].exports;
      });
      moduleRaid.cArr = i.m;
      moduleRaid.mGet = i;
    }]],
    [[1e3], {[moduleRaid.mID]: (e, t, i) => {
      mCac = i.c;
      Object.keys(mCac).forEach ((mod) => {
        moduleRaid.mObj[mod] = mCac[mod].exports;
      });
      moduleRaid.cArr = i.m;
      moduleRaid.mGet = i;
    }}, [[moduleRaid.mID]]]
  ]

  const fillModuleArray = () => {
    if (typeof webpackJsonp === 'function') {
      moduleRaid.args.forEach((argument, index) => {
        try {
          webpackJsonp(...argument);
        }
        catch (err) {
          moduleRaid.log(`moduleRaid.args[${index}] failed: ${err}`);
        }
      })
    }
    else {
      try {
        webpackJsonp.push(moduleRaid.args[1]);
      }
      catch (err) {
        moduleRaid.log(`Pushing moduleRaid.args[1] into webpackJsonp failed: ${err}`);
      }
    }

    if (moduleRaid.mObj.length == 0) {
      mEnd = false;
      mIter = 0;

      if (!webpackJsonp([],[],[mIter])) {
        throw Error('Unknown Webpack structure');
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
  };

  fillModuleArray();

  const get = (id) => {
    return moduleRaid.mObj[id]
  };

  const findModule = (query) => {
    results = [];
    modules = Object.keys(moduleRaid.mObj);

    modules.forEach(function(mKey) {
      mod = moduleRaid.mObj[mKey];

      if (typeof mod !== 'undefined') {
        if (typeof query === 'string') {
          if (typeof mod.default === 'object') {
            for (key in mod.default) {
              if (key == query) results.push(mod);
            }
          }

          for (key in mod) {
            if (key == query) results.push(mod);
          }
        } else if (typeof query === 'function') { 
          if (query(mod)) {
            results.push(mod);
          }
        } else {
          throw new TypeError(`findModule can only find via string and function, ${typeof query} was passed`);
        }
        
      }
    });

    return results;
  };

  const findFunction = (query) => {
    if (moduleRaid.cArr.length == 0) {
      throw Error('No module constructors to search through!');
    }

    results = [];

    if (typeof query === 'string') {
      moduleRaid.cArr.forEach((ctor, index) => {
        if (ctor.toString().includes(query)) {
          results.push(moduleRaid.mObj[index]);
        }
      });
    } else if (typeof query === 'function') {
      modules = Object.keys(moduleRaid.mObj);

      modules.forEach((mKey, index) => {
        mod = moduleRaid.mObj[mKey];

        if (query(mod)) {
          results.push(moduleRaid.mObj[index]);
        }
      });
    } else {
      throw new TypeError(`findFunction can only find via string and function, ${typeof query} was passed`);
    }

    return results;
  };

  return {
    modules: moduleRaid.mObj,
    constructors: moduleRaid.cArr,
    findModule: findModule,
    findFunction: findFunction,
    get: moduleRaid.mGet ? moduleRaid.mGet : get
  };
}
