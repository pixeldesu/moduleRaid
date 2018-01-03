# moduleRaid

_:gift: Taking apart webpackJsonp_

## Installation

You can get moduleRaid over npm

```
$ npm install moduleraid
```

Or if you directly want to use it in the browser

```html
<script src="https://unpkg.com/moduleraid@1.0.0/moduleraid.js"></script>
```

Alternatively, just copy the script from `moduleraid.js` and run it in a devtool console
on the site of your choosing.

## Usage

### Preparation

Using `moduleRaid` as a module, simply require and execute it somewhere where it will end up as a public facing script on a page that also
includes a Webpack build!

```js
const moduleRaid = require('moduleraid')

window.mR = moduleRaid()
```

If you a running the script from the console or loading it over a service like unpkg, no further need for preparations!

### The `moduleraid` object

Once `moduleRaid` is run or included on a page that includes a Webpack build (usually noted by a `webpackJsonp` function), it
will return a object, containing:

* `modules`: An array with all modules we could get from Webpack
* `get(id)`: Get the module from the specified `id`
* `findModule(query)`: Return the module that has `query` as a key in its exports

If you run the code in devtools or load it as external script from unpkg/etc. the `moduleRaid` object can be found in `window.mR` by default.

## How it works

There already was a script basically doing the same as `moduleRaid` some months earlier, called [`webcrack`](https://gist.github.com/no-boot-device/cb63762000e606e50690911cac1bcead) (made by [no-boot-device](https://github.com/no-boot-device)), which was rendered obsolute due to
structural changes in how you can access Webpack modules from the outside.

This library is an effort to bring back the ability to inspect all available modules, for debugging or userscript purposes.

As noted above, Webpack exposes a function `webpackJsonp` containing all the code that has been bundled with Webpack. The function takes three
parameters, all of them being an array. The first two don't seem to really matter, the last one is interesting, it seems to directly return
a module given an index.

So, in a brute-forcy manner we simply run a `while` over `webpackJsonp([], [], [i])` until we get an exception from Webpack (trying to run `call`
on `undefined`), and now we have all modules (_or most of them_)!

## Known Issues

* It crashes if `webpackJsonp` is not existing
* There seem to be a lot of empty modules, I'm not sure if these are _padding_ or something is missing here

## License

moduleRaid is licensed under the MIT License