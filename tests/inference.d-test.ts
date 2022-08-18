import * as D from '../src/decoders.js';

/**
 * Utility type to compare two types - will resolve to `true` if equal, otherwise `false`.
 */
type Equals<A1, A2> = (<A>() => A extends A2 ? true : false) extends <
  A
>() => A extends A1 ? true : false
  ? true
  : false;

/**
 * A function declaration for testing types.
 * Intended to be used within `run` function in order to validate results.
 */
declare function test<Type, Expect, Outcome extends boolean>(
  debug?: Type
): Equals<Equals<Type, Expect>, Outcome>;

/**
 * A function declaration to throw type errors for `test` functions if proposition is false.
 */
declare function run(ta: true[]): void;

/**
 *  Simple decoder types
 */
type numberType = D.Infer<typeof D.number>;
type stringType = D.Infer<typeof D.string>;
type booleanType = D.Infer<typeof D.boolean>;

run([
  test<numberType, number, true>(),
  test<numberType, number[], false>(),
  test<stringType, string[], false>(),
  test<stringType, '234', false>(),
  test<booleanType, boolean, true>(),
  test<booleanType, number, false>(),
]);

/**
 * Literal decoder types
 */

const stringLiteralDecoder = D.literal('value');
const numberLiteralDecoder = D.literal(1);

type stringLiteralType = D.Infer<typeof stringLiteralDecoder>;
type numberLiteralType = D.Infer<typeof numberLiteralDecoder>;

run([
  test<stringLiteralType, 'value', true>(),
  test<stringLiteralType, 'not-value', false>(),
  test<numberLiteralType, 1, true>(),
  test<numberLiteralType, 'value', false>(),
  test<numberLiteralType, 2, false>(),
]);

/**
 * Enum Decoder
 */

enum AbEnum {
  A,
  B,
}

const AbEnumDecoder = D.enumValue(AbEnum);
type AbEnumType = D.Infer<typeof AbEnumDecoder>;

// Note AbEnumType and AbEnum are not technically identical - but functionally are
run([
  test<AbEnumType[keyof AbEnum], AbEnum[keyof AbEnum], true>(),
  test<AbEnumType[keyof AbEnum], string, false>(),
]);

/**
 * Array decoder types
 */

const numberArrayDecoder = D.array(D.number);
const stringArrayDecoder = D.array(D.string);
const unionArrayDecoder = D.array(D.union([D.string, D.number]));

type numberArrayType = D.Infer<typeof numberArrayDecoder>;
type stringArrayType = D.Infer<typeof stringArrayDecoder>;
type unionArrayType = D.Infer<typeof unionArrayDecoder>;

run([
  test<numberArrayType, number[], true>(),
  test<numberArrayType, string[], false>(),
  test<numberArrayType, number, false>(),
  test<stringArrayType, string[], true>(),
  test<stringArrayType, [], false>(),
  test<stringArrayType, string, false>(),
  test<unionArrayType, (string | number)[], true>(),
  test<unionArrayType, string[], false>(),
  test<unionArrayType, [], false>(),
  test<unionArrayType, 'a', false>(),
]);

/**
 * Optional decoder types
 */

const optionalNumberDecoder = D.optional(D.number);
const optionalStringDecoder = D.optional(D.string);
const optionalUnionDecoder = D.optional(D.union([D.string, D.number]));

type optionalNumberType = D.Infer<typeof optionalNumberDecoder>;
type optionalStringType = D.Infer<typeof optionalStringDecoder>;
type optionalUnionType = D.Infer<typeof optionalUnionDecoder>;

run([
  test<optionalNumberType, number | undefined, true>(),
  test<optionalNumberType, undefined, false>(),
  test<optionalNumberType, number, false>(),
  test<optionalStringType, string | undefined, true>(),
  test<optionalStringType, number, false>(),
  test<optionalUnionType, number | string | undefined, true>(),
  test<optionalUnionType, undefined, false>(),
]);

/**
 * Nullable decoder types
 */

const nullableNumberDecoder = D.nullable(D.number);
const nullableStringDecoder = D.nullable(D.string);
const nullableUnionDecoder = D.nullable(D.union([D.string, D.number]));

type nullableNumberType = D.Infer<typeof nullableNumberDecoder>;
type nullableStringType = D.Infer<typeof nullableStringDecoder>;
type nullableUnionType = D.Infer<typeof nullableUnionDecoder>;

run([
  test<nullableNumberType, number | null, true>(),
  test<nullableNumberType, null, false>(),
  test<nullableNumberType, number, false>(),
  test<nullableStringType, string | null, true>(),
  test<nullableStringType, number, false>(),
  test<nullableUnionType, number | string | null, true>(),
  test<nullableUnionType, null, false>(),
]);

/**
 * object decoder types
 */

const emptyObjectDecoder = D.object({});
const simpleObjectDecoder = D.object({ a: D.string, b: D.number });
const nestedObjectDecoder = D.object({
  a: D.object({ a: D.object({ a: D.literal('a') }) }),
});
const objectWithOptionalPropertiesDecoder = D.object({
  a: D.optional(D.string),
  b: D.number,
});

type emptyObjectType = D.Infer<typeof emptyObjectDecoder>;
type simpleObjectType = D.Infer<typeof simpleObjectDecoder>;
type nestedObjectType = D.Infer<typeof nestedObjectDecoder>;
type objectWithOptionalPropertiesType = D.Infer<
  typeof objectWithOptionalPropertiesDecoder
>;

run([
  // eslint-disable-next-line @typescript-eslint/ban-types
  test<emptyObjectType, {}, true>(),
  test<simpleObjectType, { a: string; b: number }, true>(),
  test<nestedObjectType, { a: { a: { a: 'a' } } }, true>(),
  test<
    objectWithOptionalPropertiesType,
    { a?: string | undefined; b: number },
    true
  >(),
]);

/**
 * Union decoder types
 */
const singleUnionDecoder = D.union([D.object({ a: D.number })]);
const literalUnionDecoder = D.union([
  D.literal('a'),
  D.literal('b'),
  D.literal('c'),
  D.literal('d'),
  D.literal('e'),
]);
const numberAndOptionalStringUnionDecoder = D.union([
  D.number,
  D.optional(D.string),
]);
const stringAndStringArrayUnionDecoder = D.union([D.array(D.string), D.string]);
const nestedObjectUnionDecoder = D.union([
  D.object({
    type: D.literal('a'),
    a: D.object({ a: D.string }),
  }),
  D.object({
    type: D.literal('b'),
    a: D.object({ b: D.string }),
  }),
]);

type singleUnionType = D.Infer<typeof singleUnionDecoder>;
type literalUnionType = D.Infer<typeof literalUnionDecoder>;
type numberAndOptionalStringUnionType = D.Infer<
  typeof numberAndOptionalStringUnionDecoder
>;
type stringAndStringArrayUnionType = D.Infer<
  typeof stringAndStringArrayUnionDecoder
>;
type nestedObjectUnionType = D.Infer<typeof nestedObjectUnionDecoder>;

run([
  test<singleUnionType, { a: number }, true>(),
  test<literalUnionType, 'a' | 'b' | 'c' | 'd' | 'e', true>(),
  test<numberAndOptionalStringUnionType, number | string | undefined, true>(),
  test<stringAndStringArrayUnionType, string | string[], true>(),
  test<
    nestedObjectUnionType,
    { type: 'a'; a: { a: string } } | { type: 'b'; a: { b: string } },
    true
  >(),
]);

/**
 * Intersection decoder types
 */

const singleIntersectionDecoder = D.intersection([D.object({ a: D.string })]);
const literalAndStringIntersectionDecoder = D.intersection([
  D.literal('a'),
  D.string,
]);
const objectIntersectionDecoder = D.intersection([
  D.object({ a: D.number }),
  D.object({ b: D.string }),
]);
const overlappingObjectIntersectionDecoder = D.intersection([
  D.object({ a: D.string, b: D.number, c: D.optional(D.string) }),
  D.object({ b: D.number, c: D.string, e: D.string }),
  D.object({ b: D.number, c: D.string, f: D.optional(D.number) }),
]);
const impossibleIntersectionDecoder = D.intersection([D.number, D.string]);

type singleIntersectionType = D.Infer<typeof singleIntersectionDecoder>;
type literalAndStringIntersectionType = D.Infer<
  typeof literalAndStringIntersectionDecoder
>;
type objectIntersectionType = D.Infer<typeof objectIntersectionDecoder>;
type overlappingObjectIntersectionType = D.Infer<
  typeof overlappingObjectIntersectionDecoder
>;
type impossibleIntersectionType = D.Infer<typeof impossibleIntersectionDecoder>;

run([
  test<singleIntersectionType, { a: string }, true>(),
  test<literalAndStringIntersectionType, 'a', true>(),
  test<objectIntersectionType, { a: number; b: string }, true>(),
  test<
    overlappingObjectIntersectionType,
    { a: string; b: number; c: string; e: string; f?: number },
    true
  >(),
  test<impossibleIntersectionType, never, true>(),
]);
