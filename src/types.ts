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
}

/**
 * Function type describing any kind of possible function
 */
export type AnyFunction = (...args: unknown[]) => unknown

/**
 * Type describing possible contents of Webpack modules
 */
export type ModuleLike =
  | string
  | number
  | AnyFunction
  | Array<{ default: unknown }>
  | Record<string, unknown>
  | Array<unknown>

/**
 * Type describing generic contents of default modules
 * @internal
 */
export type DefaultModuleLike = {
  default: Record<string, unknown>
}

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
 * @internal
 */

/**
 * Type describing the __webpack_require__ function
 */
export type WebpackRequireFunction = (key: string | number) => ModuleLike

/**
 * Type describing Webpack module constructors
 * @internal
 */
export type WebpackModuleFunction =
  | ((e: unknown, t: unknown, i: WebpackRequire) => void)
  | ((e: WebpackRequire) => void)
