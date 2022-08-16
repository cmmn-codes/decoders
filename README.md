# Common Decoders
[![test-build](https://github.com/cmmn-codes/decoders/actions/workflows/tests.yml/badge.svg)](https://github.com/cmmn-codes/decoders/actions/workflows/tests.yml)
[![Coverage Status](https://coveralls.io/repos/github/cmmn-codes/decoders/badge.svg?branch=main)](https://coveralls.io/github/cmmn-codes/decoders?branch=main)

A minimal typescript schema library for runtime validations.

Write your type definitions once and get both types and runtime validation checks.
Decoders are light-weight, composable, and follow functional programming patterns.

## Installation

```bash
# NPM
npm install --save common-decoders

# Yarn
yarn add common-decoders
```

### Requirements

* Typescript >= 4.7
* Node >= 16 

## Basic Usage

### Example

```ts
import * as D from 'common-decoders';

const IdentifableDecoder = D.object({
  id: D.number,
})

const DogDecoder = D.object({
  type: D.literal('dog'),
  name: D.string,
})

const CatDecoder = D.object({
  type: D.literal('cat'),
})

const AnimalDecoder = D.union([
  IdentifableDecoder,
  D.intersection([DogDecoder, CatDecoder]),
])

type Animal = D.Infer<typeof AnimalDecoder>;
```

## API

Full documentation is available [here](https://cmmn-codes.github.io/decoders/).

Or can be built locally by running: `yarn docs`;

### ESM or CJS Imports

**TL;DR; prefer ESM**

This library supports both commonjs and modern es modules. However, it is more ergonomic for ESM usage.

Importing with tsconfig compilation option for `moduleResolution` set to `nodenext` | `node16`:  
```ts
import * as D from 'common-decoders';
import { isOk, isFailure, map, pipe } from 'common-decoders/utils';
```

Or with `moduleResolution` set to `node`:

```ts
import * as D from 'common-decoders';
import { isOk, isFailure, map, pipe } from 'common-decoders/dist/cjs/utils';
```

## Prior art:

This is not a new problem nor a particularly unique solution.
The aim of this library is to build on previous work, while being super small, simple to use, and functional in style.

For more mature and comprehensive approaches - have a look at:

- zod - https://zod.dev/
- io-ts - https://github.com/gcanti/io-ts
- joi - https://joi.dev/
