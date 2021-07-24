import stringify from 'json-stringify-safe'

import {
  AnyFunction,
  ConstructorModuleTuple,
  ModuleLike,
  ModuleList,
  WebpackArgument,
  WebpackRequire,
  WebpackRequireFunction,
} from './types'

declare function webpackJsonp(...args: WebpackArgument): ModuleLike

/**
 * Main moduleRaid class
 */
export default class ModuleRaid {
  /**
   * Option enabling or disabling debug output
   */
  private debug: boolean

  /**
   * A random generated module ID we use for injecting into Webpack
   */
  private moduleID: string = Math.random().toString(36).substring(7)

  /**
   * An array containing different argument injection methods for
   * Webpack, and subsequently pulling out methods and modules
   */
  private arguments: WebpackArgument[] = [
    [
      [0],
      [
        (_e: unknown, _t: unknown, i: WebpackRequire) => {
          const mCac = i.c
          Object.keys(mCac).forEach((mod) => {
            this.modules[mod] = mCac[mod].exports
          })
          this.constructors = i.m
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
          this.constructors = i.m
          this.get = i as unknown as WebpackRequireFunction
        },
      },
      [[this.moduleID]],
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
   * @param debug Enables debugging output for the created instance
   */
  constructor(debug: boolean = false) {
    this.debug = debug

    this.fillModules()
    this.replaceGet()
  }

  /**
   * Debug logging method, works when true is passed as an argument to the main
   * moduleRaid function, or when window.mRdebug is set to true
   * 
   * @param {*} message The message to be logged
   */
  private log(message: string): void {
    if (this.debug) {
      console.warn(`[moduleRaid] ${message}`)
    }
  }

  /**
   * Method to set an alternative getter if we weren't able to extract __webpack_require__
   * from Webpack
   */
  private replaceGet(): void {
    if (this.get === null) {
      this.get = (key: string | number) => this.modules[key]
    }
  }

  /**
   * Method that will try to inject a module into Webpack or get modules
   * depending on it's success it might be more or less brute about it
   */
  private fillModules(): void {
    if (typeof webpackJsonp === 'function') {
      this.arguments.forEach((argument, index) => {
        try {
          webpackJsonp(...argument)
        } catch (err) {
          this.log(`moduleRaid.args[${index}] failed: ${err}`)
        }
      })
    } else {
      try {
        ;(webpackJsonp as unknown as ModuleLike[]).push(this.arguments[1])
      } catch (err) {
        this.log(`Pushing moduleRaid.args[1] into webpackJsonp failed: ${err}`)
      }
    }

    if (this.modules.length == 0) {
      let moduleEnd = false
      let moduleIterator = 0

      if (!webpackJsonp([], [], [moduleIterator])) {
        throw Error('Unknown Webpack structure')
      }

      while (!moduleEnd) {
        try {
          this.modules[moduleIterator] = webpackJsonp([], [], [moduleIterator])
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
              if (
                module
                  .toString()
                  .toLowerCase()
                  .includes(query)
              )
                results.push(module)
              break
            case 'object':
              if (
                stringify(module)
                  .toLowerCase()
                  .includes(query)
              )
                results.push(module)
              break
          }
        } else if (typeof query === 'function') {
          if (query(module)) results.push(module)
        } else {
          throw new TypeError(
            `findModule can only find via string and function, ${typeof query} was passed`
          )
        }
      } catch (e) {
        this.log(`There was an error while searching through module '${key}'\n${e}`)
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
      const constructor = this.constructors[key as unknown as number]

      try {
        if (typeof query === 'string') {
          query = query.toLowerCase()

          if (constructor.toString().includes(query))
            results.push([this.constructors[key as unknown as number], this.modules[key]])
        } else if (typeof query === 'function') {
          if (query(constructor))
            results.push([this.constructors[key as unknown as number], this.modules[key]])
        }
      } catch (e) {
        this.log(`There was an error while searching through constructor '${key}'\n${e}`)
      }
    })

    return results
  }
}