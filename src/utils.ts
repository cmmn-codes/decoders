/**
 * A collection of functional utilities for working with results from decoder functions.
 * @module Utilities
 * @example
 * ```ts
 * import * as D from 'common-decoders';
 * import { pipe, map, fold } from 'common-decoders/utils';
 *
 * const result: string = pipe(
 *   1,
 *   D.number,
 *   map((n) => n + 1),
 *   fold(
 *     (error) => `Failed with message ${error}`,
 *     (value) => `Got value ${value}`
 *   )
 * );
 * ```
 */
export * from './result.js';
export * from './pipe.js';
