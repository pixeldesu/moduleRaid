import {
  AnyFunction,
  ConstructorModuleTuple,
  DefaultModuleLike,
  ModuleLike,
  ModuleList,
  ModuleRaidParameters,
  WebpackArgument,
  WebpackRequire,
  WebpackRequireFunction,
} from './types'

declare function webpackJsonp(...args: WebpackArgument): ModuleLike

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
          const mCac = i.c
          Object.keys(mCac).forEach((mod) => {
            this.modules[mod] = mCac[mod].exports
          })
          this.constructors = i.m as AnyFunction[]
          this.get = i as unknown as WebpackRequireFunction
        },
      ],
    ],
    [
      [1e3],
      {
        [this.moduleID]: (_e: unknown, _t: unknown, i: WebpackRequire) => {
          const mCac = i.c
          Object.keys(mCac).forEach((mod: string) => {
            this.modules[mod] = mCac[mod].exports
          })
          this.constructors = i.m as AnyFunction[]
          this.get = i as unknown as WebpackRequireFunction
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
    this.functionArguments[1],
    [
      [this.moduleID],
      {},
      (e: WebpackRequire) => {
        const mCac = e.m
        Object.keys(mCac).forEach((mod: string) => {
          try {
            this.modules[mod] = (e as unknown as WebpackRequireFunction)(mod)
          } catch (err) {
            this.log(
              `[arrayArguments/1] Failed to require(${mod}) with error:\n${err}\n${err.stack}`
            )
          }
        })
        this.get = e as unknown as WebpackRequireFunction
      },
    ],
  ]

  /**
   * Storage for the modules we extracted from Webpack
   */
  public modules: ModuleList = {}

  /**
   * Storage for the constructors we extracted from Webpack
   */
  public constructors: AnyFunction[] = []

  /**
   * Intermediary storage for __webpack_require__ if we were able to extract it
   */
  public get: WebpackRequireFunction | null = null

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
   *  - a single boolean is supported as a fallback to behaviour from versions before 5.1 and should not be used anymore
   *
   */
  constructor(opts?: ModuleRaidParameters | boolean) {
    let options = {
      entrypoint: 'webpackJsonp',
      debug: false,
    }

    if (typeof opts === 'object') {
      options = {
        ...options,
        ...opts,
      }
    } else if (typeof opts === 'boolean') {
      console.warn(
        `[moduleRaid] Using a single boolean argument is deprecated, please use 'new ModuleRaid({ debug: true })'`
      )
      options.debug = opts
    }

    this.entrypoint = options.entrypoint
    this.debug = options.debug

    this.fillModules()
    this.replaceGet()
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
    if (typeof webpackJsonp === 'function') {
      this.functionArguments.forEach((argument, index) => {
        try {
          window[this.entrypoint](...argument)
        } catch (err) {
          this.log(`moduleRaid.functionArguments[${index}] failed:\n${err}\n${err.stack}`)
        }
      })
    } else {
      this.arrayArguments.forEach((argument, index) => {
        try {
          ;(window[this.entrypoint] as ModuleLike[]).push(argument)
        } catch (err) {
          this.log(
            `Pushing moduleRaid.arrayArguments[${index}] into ${this.entrypoint} failed:\n${err}\n${err.stack}`
          )
        }
      })
    }

    if (this.modules.length == 0) {
      let moduleEnd = false
      let moduleIterator = 0

      if (!window[this.entrypoint]([], [], [moduleIterator])) {
        throw Error('Unknown Webpack structure')
      }

      while (!moduleEnd) {
        try {
          this.modules[moduleIterator] = window[this.entrypoint]([], [], [moduleIterator])
          moduleIterator++
        } catch (err) {
          moduleEnd = true
        }
      }
    }
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
  public findModule(query: string | ((query: ModuleLike) => boolean)): ModuleLike[] {
    const results: ModuleLike[] = []
    const modules = Object.keys(this.modules)

    if (modules.length === 0) {
      throw new Error('There are no modules to search through!')
    }

    modules.forEach((key: string) => {
      const module = this.modules[key]

      try {
        if (typeof query === 'string') {
          query = query.toLowerCase()

          switch (typeof module) {
            case 'string':
              if (module.includes(query)) results.push(module)
              break
            case 'function':
              if (module.toString().toLowerCase().includes(query)) results.push(module)
              break
            case 'object':
              if (typeof (module as DefaultModuleLike).default === 'object') {
                for (key in (module as DefaultModuleLike).default) {
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
      } catch (err) {
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
    query: string | ((query: ModuleLike) => boolean)
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
      } catch (err) {
        this.log(
          `There was an error while searching through constructor '${key}':\n${err}\n${err.stack}`
        )
      }
    })

    return results
  }
}
