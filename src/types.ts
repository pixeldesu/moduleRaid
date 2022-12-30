/**
 * Constructor parameters for the moduleRaid class
 */
export interface ModuleRaidParameters {
  /**
   * The Webpack entrypoint present on the global window object
   */
  entrypoint?: string

  /**
   * Option enabling or disabling debug output
   */
  debug?: boolean

  /**
   * Option enabling strict mode (only defined entrypoint) or entrypoint guessing
   */
  strict?: boolean
}

/**
 * Function type describing any kind of possible function
 */
export type AnyFunction = (...args: unknown[]) => unknown

/**
 * Type describing the list of modules
 */
export type WebpackModuleList = {
  [key in string | number | symbol]: WebpackCacheModule
}

/**
 *  Return type for the `findConstructor` method
 */
export type ConstructorModuleTuple = [AnyFunction, WebpackModule]

/**
 * Type describing possible arguments to `webpackJsonp`
 * @internal
 */
export type WebpackArgument = [
  [number] | [string] | [],
  (
    | [WebpackModuleFunction]
    | { [key in string | number]: WebpackModuleFunction }
    | []
    | Record<string, unknown>
  ),
  ([[number] | [string] | number] | WebpackModuleFunction)?
]

/**
 * Type describing the __webpack_require__ function
 * @internal
 */
export interface WebpackRequire {
  c?: WebpackModuleList
  m?: AnyFunction[] | WebpackModuleList,
  (key: string | number): WebpackCacheModule
}

/**
 * Type describing Webpack module constructors
 * @internal
 */
export type WebpackModuleFunction =
  | ((e: unknown, t: unknown, i: WebpackRequire) => void)
  | ((e: WebpackRequire) => void)

/**
 * Type describing cached modules in Webpack
 */
export type WebpackCacheModule = {
  i: string | number,
  l: boolean,
  exports: WebpackModule
}

/**
 * Type describing general modules
 */
export type WebpackModule = {
  default?: any,
  [key: string]: any
}