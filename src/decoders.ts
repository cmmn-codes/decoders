/**
 * Set of minimal decoder types that are composable into schema for data validation.
 * @module Decoders
 * @example
 * ```ts
 * import * as D from 'common-decoders';
 *
 * const UserDecoder = D.object({ id: D.number, name: D.string });
 * type GetUser = D.Infer<typeof UserDecoder>;
 * ```
 */

import {
  arrayMap,
  chain,
  failure,
  isFailure,
  isOk,
  map,
  ok,
  Result,
  sequence,
} from './result.js';
import { pipe } from './pipe.js';

export type DecoderResult<T> = Result<string, T>;

/**
 * Decoder takes an input value and returns a DecoderResult which either contains a DecoderError or a successfully decoded result.
 */
export type Decoder<O, I = unknown> = (value: I) => DecoderResult<O>;

/**
 * Utility to get all optional keys on an object
 */
type OptionalKeys<T extends object> = {
  [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];
/**
 * Converts all keys which may be undefined to optional
 */
type Optionalize<
  T extends object,
  Keys extends keyof T = OptionalKeys<T>
> = Omit<T, Keys> & Partial<Pick<T, Keys>>;

/**
 * Utility helper to flatten deeply nested type generics into a format which is prettier for your IDE.
 */
type FlattenType<T> = T extends object
  ? { [K in keyof T]: FlattenType<T[K]> }
  : T;

/**
 * Type helper to infer the type from any given Decoder.
 * @example ```ts
 *  const fooDecoder = D.object({ foo: D.string })
 *  // Create new type from fooDecoder, Foo will equal { foo: string };
 *  type Foo = Infer<typeof fooDecoder>;
 * ```
 */
export type Infer<T extends Decoder<any>> = FlattenType<_Infer<T>>;

type _Infer<T extends Decoder<any>> = T extends Decoder<infer A>
  ? A extends Record<PropertyKey, Decoder<any>>
    ? InferDecoderObjectType<A>
    : A
  : never;

type InferDecoderObjectType<T extends Record<PropertyKey, Decoder<any>>> =
  Optionalize<{
    [K in keyof T]: _Infer<T[K]>;
  }>;

/**
 * Creates an optional decoder from a given decoder.
 * Allows input values to be undefined.
 * @param decoder
 * @example ```ts
 * // Creates a decoder that accepts values of type string or undefined.
 * const decoder = D.optional(D.string)
 * ```
 */
export function optional<O, I = unknown>(
  decoder: Decoder<O, I>
): Decoder<O | undefined, I> {
  return (value: I) => {
    if (value === undefined) return ok(undefined);
    return decoder(value);
  };
}

/**
 * Creates a union decoder from an array of decoders.
 * Union decoder checks if input value matches any of the provided decoders.
 * @param decoders
 * @example ```ts
 * const fooDecoder = D.object({ common: D.number , foo: D.string });
 * const barDecoder = D.object({ common: D.number, bar: D.string });
 * // Creates a union which will successfully decode { common: 1, foo: 'a' } and { common: 3, bar: 'b' }
 * const unionDecoder = D.union([barDecoder, fooDecoder])
 * ```
 */
export function union<A, B, C, D, E, I = unknown>(
  decoders: [
    Decoder<A, I>,
    Decoder<B, I>,
    Decoder<C, I>,
    Decoder<D, I>,
    Decoder<E, I>
  ]
): Decoder<A | B | C | D | E, I>;
export function union<A, B, C, D, I = unknown>(
  decoders: [Decoder<A, I>, Decoder<B, I>, Decoder<C, I>, Decoder<D, I>]
): Decoder<A | B | C | D, I>;
export function union<A, B, C, I = unknown>(
  decoders: [Decoder<A, I>, Decoder<B, I>, Decoder<C, I>]
): Decoder<A | B | C, I>;
export function union<A, B, I = unknown>(
  decoders: [Decoder<A, I>, Decoder<B, I>]
): Decoder<A | B, I>;
export function union<A, I = unknown>(decoders: [Decoder<A, I>]): Decoder<A, I>;
export function union<I = unknown>(
  decoders: readonly Decoder<any>[]
): Decoder<any, I> {
  return (input: I) => {
    // TODO: write this elegantly and cover edge case;
    for (const decoder of decoders) {
      const result = decoder(input);
      if (isOk(result)) return result;
    }
    return failure('Value is not one of type');
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return Object.prototype.toString.call(v) === '[object Object]';
}

function isPrimitive(v: unknown): v is number | string | undefined {
  return typeof v === 'number' || typeof v === 'string' || v === undefined;
}

function filterIntersection(input: unknown): (values: unknown[]) => any {
  return (values) => {
    if (isPrimitive(input)) return input;
    if (Array.isArray(input)) {
      // What about an array?
      return input;
    }
    if (!isObject(input)) {
      return input;
    }
    const r: any = {};
    for (const v of values) {
      if (!isObject(v)) {
        // this should not be possible, but what do we do in this case?
        continue;
      }
      for (const k in v) {
        if (hasOwnProperty(input, k)) {
          // what about deeply nested values?
          r[k] = input[k];
        }
      }
    }
    return r;
  };
}

/**
 * Creates an intersection decoder from an array of decoders.
 * Intersection decoder checks if input value matches all provided decoders.
 * @param decoders
 * @example ```ts
 * const fooDecoder = D.object({ foo: D.string });
 * const barDecoder = D.object({ bar: D.string });
 * // Creates a union which will successfully decode { foo: 'a', bar: 'b' }
 * const unionDecoder = D.union([barDecoder, fooDecoder])
 * ```
 */
export function intersection<A, B, C, I = unknown>(
  decoders: [Decoder<A, I>, Decoder<B, I>, Decoder<C, I>]
): Decoder<A & B & C, I>;
export function intersection<A, B, I = unknown>(
  decoders: [Decoder<A, I>, Decoder<B, I>]
): Decoder<A & B, I>;
export function intersection<A, I = unknown>(
  decoders: [Decoder<A, I>]
): Decoder<A, I>;
export function intersection<I = unknown>(
  decoders: Decoder<any>[]
): Decoder<any, I> {
  return (input: I) => {
    return pipe(
      decoders,
      arrayMap((decoder) => decoder(input)),
      sequence,
      map(filterIntersection(input))
    );
  };
}

function hasOwnProperty<X extends object, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  return obj.hasOwnProperty(prop);
}

/**
 * Creates an object decoder from an object of key/decoder pairs.
 * Object decoder checks that the input value is an object that has key/value pairs valid for the specified decoders.
 * @example ```ts
 * // Creates a decoder that will successfully decode input value: { a: 'aaa', b: 123 }.
 * const decoder = D.object({ a: D.string, b: D.optional(D.number) });
 * ```
 */
export function object<
  T extends Record<PropertyKey, Decoder<unknown>>,
  O extends FlattenType<InferDecoderObjectType<T>>
>(o: T): Decoder<O> {
  return (v: unknown) => {
    if (typeof v !== 'object') return failure('Not an object');
    if (Array.isArray(v)) return failure('Not an object');
    if (v == null) return failure('Not an object');
    let result: DecoderResult<Record<string, any>> = ok({});
    for (const [key, decoder] of Object.entries(o)) {
      if (isFailure(result)) {
        break;
      }
      result = pipe(
        result,
        chain((decodedValue) => {
          const inputValue = hasOwnProperty(v, key) ? v[key] : undefined;
          return pipe(
            inputValue,
            decoder,
            map((v) => {
              decodedValue[key] = v;
              return decodedValue;
            })
          );
        })
      );
    }
    return result as DecoderResult<O>;
  };
}

/**
 * Creates an array decoder from a given decoder.
 * Array decoder checks that the input value is an array that has all members valid for the provided decoder.
 * @example ```ts
 * // Creates a decoder that will successfully decode input value: [1, undefined, 3].
 * const decoder = D.array(D.optional(D.number)));
 * ```
 */
export function array<T>(decoder: Decoder<T>): Decoder<T[]> {
  return (v: unknown) => {
    if (Array.isArray(v)) {
      return pipe(v, arrayMap(decoder), sequence);
    }
    return failure('Not an array');
  };
}

type EnumLike = {
  [id: string]: number | string;
  [nu: number]: string;
};

/**
 * Creates an enum decoder from a typescript enum.
 * Enum decoder checks if input value can be converted to a type of the specified enum.
 * @param e
 * @example ```ts
 * enum MyEnum {
 *   A = 1,
 *   B = 2,
 * }
 * // Creates a decoder that will successfully decode input value of 1 or 'A' to MyEnum.A.
 * const decoder = D.enum(MyEnum);
 * ```
 */
export function enumValue<T extends EnumLike>(e: T): Decoder<T[keyof T]> {
  return (v: unknown) => {
    if (typeof v !== 'number' && typeof v !== 'string') {
      return failure('Not an enum value');
    }
    const value = e[v];
    if (value == null) {
      return failure('Not an enum value');
    }
    if (typeof value === 'number') {
      return ok(e[v] as T[keyof T]);
    }
    return ok(e[value] as T[keyof T]);
  };
}

/**
 * Creates a literal decoder from a given string or number.
 * Literal decoder checks if input value is explicitly equal to the specified value.
 * @param value
 * @example ```ts
 * // Creates a decoder that will successfully decode input value 'Strict' and fail for all other values.
 * const decoder = D.enum('Strict');
 * ```
 */
export function literal<T extends string | number, I = unknown>(
  value: T
): Decoder<T, I> {
  return (v: I) => {
    if (
      (typeof v === 'number' || typeof v === 'string') &&
      value === v.valueOf()
    ) {
      return ok(value);
    }
    return failure('Does not match literal value');
  };
}

/**
 * A number decoder - successfully decodes input values that are numbers or fails otherwise.
 */
export function number(v: unknown): DecoderResult<number> {
  if (typeof v !== 'number' || isNaN(v)) return failure('Not a number');
  return ok(v);
}

/**
 * A string decoder - successfully decodes input values that are strings or fails otherwise.
 */
export function string(v: unknown): DecoderResult<string> {
  if (typeof v !== 'string') return failure('Not a string');
  return ok(v);
}

/**
 * A boolean decoder - successfully decodes boolean values or fails otherwise.
 */
export function boolean(v: unknown): DecoderResult<boolean> {
  if (v === false || v === true) return ok(v);
  return failure('Not a boolean');
}
