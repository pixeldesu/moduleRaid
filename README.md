<div align='center'>
  <img width=200px src='.github/logo.png?raw=true'>

  <h1>moduleRaid</h1>
  <p>moduleRaid is a utility to get modules and module constructors from <code>webpackJsonp</code> functions (or similar endpoints) embedded on websites by Webpack. It also provides functions to search through returned modules.</p>
</div>

<h2 align='center'>Installation</h2>

You can get moduleRaid over npm

```shell
$ npm install moduleraid
```

Or if you directly want to use it in the browser

```html
<script src="https://unpkg.com/moduleraid/dist/moduleraid.iife.js"></script>
```

Or alternatively, just copy the contents from above unpkg link into the devtools console on a website!

<h2 align='center'>Usage</h2>

### Preparation

Using `moduleRaid` as a module, simply require and execute it somewhere where it will end up as a public facing script on a page that also
includes a Webpack build!

```js
import ModuleRaid from 'moduleRaid'

const mR = new ModuleRaid()
```

### Examples

Now, with the `mR` instance available and modules being fetched, you can use the two available `find*()` methods to search for modules!

```js
let results = mR.findModule('coolFeature')
// => Array of fitting modules for the search query

let constRes = mR.findConstructor('_internal')
// => Array of fitting constructor/module tuples for the search query

// after moduleRaid has been set up you can now listen for new chunks being loaded
document.addEventListener('moduleraid:webpack-push', (e) => {
  // e.detail contains the arguments push() was called with

  // your code here...
})
```

For more in-depth documentation around what you can use of moduleRaid, you can visit the **[API Documentation](https://moduleraid.netlify.app/)**!
<h2 align='center'>Special Thanks</h2>

* [twilight-sparkle-irl](https://github.com/twilight-sparkle-irl) for [`webcrack`](https://gist.github.com/twilight-sparkle-irl/cb63762000e606e50690911cac1bcead), of which the initial module extraction was based on
* [pedroslopez](https://github.com/pedroslopez) for Webpack 5 support, which I backported from their fork

<h2 align='center'>License</h2>

moduleRaid is licensed under the MIT License
