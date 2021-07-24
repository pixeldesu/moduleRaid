/**
 * Function type describing any kind of possible function
 */
export type AnyFunction = (...args: unknown[]) => unknown

/**
 * Type describing possible contents of Webpack modules
 */
export type ModuleLike = string | number | AnyFunction | Record<string, unknown> | Array<unknown>

/**
 * Type describing the list of modules
 */
export type ModuleList = {
  [key in string | number]: ModuleLike
}

/**
 *  Return type for the `findConstructor` method
 */
export type ConstructorModuleTuple = [AnyFunction, ModuleLike]

/**
 * Type describing possible arguments to `webpackJsonp`
 */
export type WebpackArgument = [
  [number] | [],
  [WebpackModuleFunction] | { [key in string | number]: WebpackModuleFunction } | [],
  [[number] | [string] | number]?
]

/**
 * Type describing the contents of the Webpack module cache
 */
export type WebpackModuleCache = {
  [key: string]: { exports: ModuleLike }
}

/**
 * Type describing the prototype contents of the __webpack_require__ 
 */
export interface WebpackRequire {
  c: WebpackModuleCache
  m: AnyFunction[]
}

/**
 * Type describing the __webpack_require__ function
 */
export type WebpackRequireFunction = (key: string | number) => ModuleLike

/**
 * Type describing Webpack module constructors
 */
export type WebpackModuleFunction = (e: unknown, t: unknown, i: WebpackRequire) => void
