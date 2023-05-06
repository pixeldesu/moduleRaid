import {
  AnyFunction,
  ConstructorModuleTuple,
  ModuleRaidParameters,
  WebpackArgument,
  WebpackModule,
  WebpackModuleList,
  WebpackRequire
} from './types'

/**
 * Main moduleRaid class
 */
export class ModuleRaid {
  /**
   * The Webpack entrypoint present on the global window object
   *
   * @default `webpackJsonp`
   */
  private entrypoint: string

  /**
   * Option enabling or disabling debug output
   *
   * @default `false`
   */
  private debug: boolean

  /**
   * Option enabling strict mode (only defined entrypoint) or entrypoint guessing
   */
  private strict: boolean

  /**
   * A random generated module ID we use for injecting into Webpack
   */
  private moduleID: string = Math.random().toString(36).substring(7)

  /**
   * An array containing different argument injection methods for
   * Webpack (before version 4), and subsequently pulling out methods and modules
   * @internal
   */
  private functionArguments: WebpackArgument[] = [
    [
      [0],
      [
        (_e: unknown, _t: unknown, i: WebpackRequire) => {
          this.modules = i.c!
          this.constructors = i.m as AnyFunction[]
          this.get = i
        },
      ],
    ],
    [
      [1e3],
      {
        [this.moduleID]: (_e: unknown, _t: unknown, i: WebpackRequire) => {
          this.modules = i.c!
          this.constructors = i.m as AnyFunction[]
          this.get = i
        },
      },
      [[this.moduleID]],
    ],
  ]

  /**
   * An array containing different argument injection methods for
   * Webpack (after version 4), and subsequently pulling out methods and modules
   * @internal
   */
  private arrayArguments: WebpackArgument[] = [
    [
      [this.moduleID],
      {},
      (e: WebpackRequire) => {
        const mCac = e.m!
        Object.keys(mCac).forEach((mod: string) => {
          try {
            this.modules[mod] = e(mod)
          } catch (err: any) {
            this.log(
              `[arrayArguments/1] Failed to require(${mod}) with error:\n${err}\n${err.stack}`
            )
          }
        })
        this.get = e
      },
    ],
    this.functionArguments[1],
  ]

  /**
   * Storage for the modules we extracted from Webpack
   */
  public modules: WebpackModuleList = {}

  /**
   * Storage for the constructors we extracted from Webpack
   */
  public constructors: AnyFunction[] = []

  /**
   * Intermediary storage for __webpack_require__ if we were able to extract it
   */
  public get?: WebpackRequire

  /**
   * moduleRaid constructor
   *
   * @example
   * Constructing an instance without any arguments:
   * ```ts
   * const mR = new ModuleRaid()
   * ```
   *
   * Constructing an instance with the optional `opts` object:
   * ```ts
   * const mR = new ModuleRaid({ entrypoint: 'webpackChunk_custom_name' })
   * ```
   *
   * @param opts a object containing options to initialize moduleRaid with
   *  - **opts:**
   *    - _entrypoint_: the Webpack entrypoint present on the global window object
   *    - _debug_: whether debug mode is enabled or not
   *    - _strict_: whether strict mode is enabled or not
   */
  constructor(opts?: ModuleRaidParameters | boolean) {
    let options = {
      entrypoint: 'webpackJsonp',
      debug: false,
      strict: false,
    }

    if (typeof opts === 'object') {
      options = {
        ...options,
        ...opts,
      }
    }

    this.entrypoint = options.entrypoint
    this.debug = options.debug
    this.strict = options.strict

    this.detectEntrypoint()
    this.fillModules()
    this.replaceGet()
    this.setupPushEvent()
  }

  /**
   * Debug logging method, outputs to the console when {@link ModuleRaid.debug} is true
   *
   * @param {*} message The message to be logged
   * @internal
   */
  private log(message: string): void {
    if (this.debug) {
      console.warn(`[moduleRaid] ${message}`)
    }
  }

  /**
   * Method to set an alternative getter if we weren't able to extract __webpack_require__
   * from Webpack
   * @internal
   */
  private replaceGet(): void {
    if (this.get === null) {
      this.get = (key: string | number) => this.modules[key]
    }
  }

  /**
   * Method that will try to inject a module into Webpack or get modules
   * depending on it's success it might be more or less brute about it
   * @internal
   */
  private fillModules(): void {
    if (typeof window[this.entrypoint] === 'function') {
      this.functionArguments.forEach((argument, index) => {
        try {
          if (this.modules && Object.keys(this.modules).length > 0) return

          window[this.entrypoint](...argument)
        } catch (err: any) {
          this.log(`moduleRaid.functionArguments[${index}] failed:\n${err}\n${err.stack}`)
        }
      })
    } else {
      this.arrayArguments.forEach((argument, index) => {
        try {
          if (this.modules && Object.keys(this.modules).length > 0) return

          window[this.entrypoint].push(argument)
        } catch (err: any) {
          this.log(
            `Pushing moduleRaid.arrayArguments[${index}] into ${this.entrypoint} failed:\n${err}\n${err.stack}`
          )
        }
      })
    }

    if (this.modules && Object.keys(this.modules).length == 0) {
      let moduleEnd = false
      let moduleIterator = 0

      if (typeof window[this.entrypoint] != 'function' || !window[this.entrypoint]([], [], [moduleIterator])) {
        throw Error('Unknown Webpack structure')
      }

      while (!moduleEnd) {
        try {
          this.modules[moduleIterator] = window[this.entrypoint]([], [], [moduleIterator])
          moduleIterator++
        } catch (err: any) {
          moduleEnd = true
        }
      }
    }
  }

  /**
   * Method to hook into `window[this.entrypoint].push` adding a listener for new
   * chunks being pushed into Webpack
   * 
   * @example
   * You can listen for newly pushed packages using the `moduleraid:webpack-push` event
   * on `document`
   * 
   * ```ts
   * document.addEventListener('moduleraid:webpack-push', (e) => {
   *   // e.detail contains the arguments push() was called with
   *   console.log(e.detail)
   * })
   * ```
   * @internal
   */
  private setupPushEvent() {
    const originalPush = window[this.entrypoint].push

    window[this.entrypoint].push = (...args: unknown[]) => {
      const result = Reflect.apply(originalPush, window[this.entrypoint], args)

      document.dispatchEvent(
        new CustomEvent('moduleraid:webpack-push', { detail: args })
      );
  
      return result
    }
  }

  /**
   * Method to try autodetecting a Webpack JSONP entrypoint based on common naming
   * 
   * If the default entrypoint, or the entrypoint that's passed to the moduleRaid constructor
   * already matches, the method exits early
   * 
   * If `options.strict` has been set in the constructor and the initial entrypoint cannot
   * be found, this method will error, demanding a strictly set entrypoint
   * @internal
   */
  private detectEntrypoint() {
    if (window[this.entrypoint] != undefined) {
      return
    }

    if (this.strict) {
      throw Error(`Strict mode is enabled and entrypoint at window.${this.entrypoint} couldn't be found. Please specify the correct one!`)
    }

    let windowObjects = Object.keys(window);

    windowObjects = windowObjects
      .filter((object) => object.toLowerCase().includes('chunk') || object.toLowerCase().includes('webpack'))
      .filter((object) => typeof window[object] === 'function' || Array.isArray(window[object]))

    if (windowObjects.length > 1) {
      throw Error(`Multiple possible endpoints have been detected, please create a new moduleRaid instance with a specific one:\n${windowObjects.join(', ')}`)
    }

    if (windowObjects.length === 0) {
      throw Error('No Webpack JSONP entrypoints could be detected')
    }

    this.log(`Entrypoint has been detected at window.${windowObjects[0]} and set for injection`)
    this.entrypoint = windowObjects[0]
  }

  /**
   * Method to search through the module object, searching for the fitting content
   * if a string is supplied
   *
   * If query is supplied as a function, everything that returns true when passed
   * to the query function will be returned
   *
   * @example
   * With a string as query argument:
   * ```ts
   * const results = mR.findModule('feature')
   * // => Array of module results
   * ```
   *
   * With a function as query argument:
   * ```ts
   * const results = mR.findModule((module) => { typeof module === 'function' })
   * // => Array of module results
   * ```
   *
   * @param query query to search the module list for
   * @return a list of modules fitting the query
   */
  public findModule(query: string | ((query: WebpackModule) => boolean)): WebpackModule[] {
    const results: WebpackModule[] = []
    const modules = Object.keys(this.modules)

    if (modules.length === 0) {
      throw new Error('There are no modules to search through!')
    }

    modules.forEach((key: string) => {
      const module = this.modules[key.toString()]

      if (module === undefined) return
      
      try {
        if (typeof query === 'string') {
          query = query.toLowerCase()

          switch (typeof module) {
            case 'string':
              if ((module as string).toLowerCase().includes(query)) results.push(module)
              break
            case 'function':
              if ((module as AnyFunction).toString().toLowerCase().includes(query)) results.push(module)
              break
            case 'object':
              if (typeof module.default === 'object') {
                for (key in module.default) {
                  if (key.toLowerCase() === query) results.push(module)
                }
              }

              for (key in module) {
                if (key.toLowerCase() === query) results.push(module)
              }
              break
          }
        } else if (typeof query === 'function') {
          if (query(module)) results.push(module)
        } else {
          throw new TypeError(
            `findModule can only find via string and function, ${typeof query} was passed`
          )
        }
      } catch (err: any) {
        this.log(
          `There was an error while searching through module '${key}':\n${err}\n${err.stack}`
        )
      }
    })

    return results
  }

  /**
   * Method to search through the constructor array, searching for the fitting content
   * if a string is supplied
   *
   * If query is supplied as a function, everything that returns true when passed
   * to the query function will be returned
   *
   * @example
   * With a string as query argument:
   * ```ts
   * const results = mR.findConstructor('feature')
   * // => Array of constructor/module tuples
   * ```
   *
   * With a function as query argument:
   * ```ts
   * const results = mR.findConstructor((constructor) => { constructor.prototype.value !== undefined })
   * // => Array of constructor/module tuples
   * ```
   *
   * Accessing the resulting data:
   * ```ts
   * // With array destructuring (ES6)
   * const [constructor, module] = results[0]
   *
   * // ...or...
   *
   * // regular access
   * const constructor = results[0][0]
   * const module = results[0][1]
   * ```
   *
   * @param query query to search the constructor list for
   * @returns a list of constructor/module tuples fitting the query
   */
  public findConstructor(
    query: string | ((query: WebpackModule) => boolean)
  ): ConstructorModuleTuple[] {
    const results: ConstructorModuleTuple[] = []
    const constructors = Object.keys(this.constructors)

    if (constructors.length === 0) {
      throw new Error('There are no constructors to search through!')
    }

    constructors.forEach((key: string) => {
      const constructor = this.constructors[key]

      try {
        if (typeof query === 'string') {
          query = query.toLowerCase()

          if (constructor.toString().toLowerCase().includes(query))
            results.push([this.constructors[key], this.modules[key]])
        } else if (typeof query === 'function') {
          if (query(constructor)) results.push([this.constructors[key], this.modules[key]])
        }
      } catch (err: any) {
        this.log(
          `There was an error while searching through constructor '${key}':\n${err}\n${err.stack}`
        )
      }
    })

    return results
  }
}
