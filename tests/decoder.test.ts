import * as D from '../src/decoders.js';
import { failure, ok } from '../src/result.js';
import { Decoder } from '../src/decoders.js';

describe('D.string', () => {
  const okCases = ['hello', ''];

  test.each(okCases)('successfully decodes string (%s)', (input) => {
    const result = D.string(input);
    expect(result).toEqual(ok(input));
  });

  const errorCases = [0, {}, NaN, undefined, null, new Date()];
  test.each(errorCases)('fails with decoder error (%s)', (input) => {
    const result = D.string(input);
    expect(result).toEqual(failure('Not a string'));
  });
});

describe('D.boolean', () => {
  const okCases = [true, false];

  test.each(okCases)('successfully decodes boolean (%s)', (input) => {
    const result = D.boolean(input);
    expect(result).toEqual(ok(input));
  });

  const errorCases = [0, {}, 'a', NaN, null, undefined, new Date()];
  test.each(errorCases)('fails with decoder error (%s)', (input) => {
    const result = D.boolean(input);
    expect(result).toEqual(failure('Not a boolean'));
  });
});

describe('D.number', () => {
  const okCases = [1, 234, 2.34];

  test.each(okCases)('successfully decodes number (%s)', (input) => {
    const result = D.number(input);
    expect(result).toEqual(ok(input));
  });

  const errorCases = ['134', NaN, undefined, null, {}, new Date(), BigInt(34)];
  test.each(errorCases)('fails with decoder error (%s)', (input) => {
    const result = D.number(input);
    expect(result).toEqual(failure('Not a number'));
  });
});

describe('D.literal(value)', () => {
  const okCases = [1, 234, 2.34, 'hello', ''];

  test.each(okCases)('literal(%s) successfully decodes identity', (input) => {
    const result = D.literal(input)(input);
    expect(result).toEqual(ok(input));
  });

  const errorCases: [string | number, any][] = [
    ['134', 123],
    ['', ' '],
    [123, '123'],
    ['undefined', undefined],
    [0, undefined],
    ['', null],
    [NaN, null],
    [NaN, NaN],
    ['', {}],
    ['date', new Date()],
    [34, BigInt(34)],
  ];
  test.each(errorCases)(
    'literal(%s) fails with decoder error for (%s)',
    (constructor, input) => {
      const result = D.literal(constructor)(input);
      expect(result).toEqual(failure('Does not match literal value'));
    }
  );
});

describe('D.object(record)', () => {
  const okCases: [
    string,
    Record<string, D.Decoder<any>>,
    Record<string, any>
  ][] = [
    ['empty object', {}, {}],
    ['singular property', { a: D.string }, { a: 'hello' }],
    [
      'multiple properties',
      { a: D.string, b: D.number },
      { a: 'hello', b: 123 },
    ],
    [
      'nested object',
      { obj: D.object({ a: D.string }) },
      { obj: { a: 'string' } },
    ],
  ];

  test.each(okCases)(
    'successfully decodes object (%s)',
    (name, decoder, input) => {
      expect(D.object(decoder)(input)).toEqual(ok(input));
    }
  );

  it('strips additional properties from input', () => {
    const decoder = D.object({
      a: D.string,
    });
    expect(decoder({ a: 'string', b: 123 })).toEqual(ok({ a: 'string' }));
  });

  const nonObjectErrorCases: [string, unknown][] = [
    ['number', 1],
    ['NaN', NaN],
    ['null', null],
    ['string', 'hello'],
    ['empty string', ''],
    ['array', [1, 2, 3]],
  ];
  test.each(nonObjectErrorCases)(
    'fails with decoded error when input is not an object (%s)',
    (name, input) => {
      const decoder = D.object({ a: D.string });
      expect(decoder(input)).toEqual(failure('Not an object'));
    }
  );

  const mismatchedObjectErrors: [
    string,
    Record<string, D.Decoder<any>>,
    Record<string, any>
  ][] = [
    [
      'input has number property when expecting string',
      { a: D.string },
      { a: 12 },
    ],
    [
      'input has object property when expecting string',
      { a: D.string },
      { a: {} },
    ],
    ['input only partially matches', { a: D.string, b: D.number }, { b: 123 }],
    [
      'input only partially matches - reverse',
      { a: D.string, b: D.number },
      { a: '123' },
    ],
    ['input has no matching keys', { a: D.string, b: D.number }, { c: '123' }],
  ];

  test.each(mismatchedObjectErrors)(
    'fails with decoded error (%s)',
    (name, input) => {
      const decoder = D.object({ a: D.string });
      expect(decoder(input)).toHaveProperty('failure');
    }
  );
});

describe('D.array(decoder)', () => {
  const okCases: [string, D.Decoder<any>, any[]][] = [
    ['string', D.string, ['1', '2', '']],
    ['number', D.number, [1, 2, 0]],
    ['object', D.object({ a: D.string }), [{ a: 'a' }, { a: 'b' }, { a: 'c' }]],
  ];
  test.each(okCases)(
    'successfully decodes object (%s)',
    (name, decoder, input) => {
      expect(D.array(decoder)(input)).toEqual(ok(input));
    }
  );

  it('strips item value of extra properties', () => {
    const decoder = D.array(D.object({ a: D.string }));
    expect(decoder([{ a: 'a', b: 'a' }])).toEqual(ok([{ a: 'a' }]));
  });

  const nonArrayErrorCases: [string, unknown][] = [
    ['number', 1],
    ['NaN', NaN],
    ['null', null],
    ['string', 'hello'],
    ['empty string', ''],
    ['array-like object', { length: 3 }],
  ];
  test.each(nonArrayErrorCases)(
    'fails with decoded error when input is not an array(%s)',
    (name, input) => {
      const decoder = D.array(D.string);
      expect(decoder(input)).toEqual(failure('Not an array'));
    }
  );

  const mismatchedElementErrors: [string, D.Decoder<any>, Array<any>][] = [
    ['no elements match', D.string, [1, 2, 3]],
    ['some elements match', D.string, ['1', 2, '3']],
  ];

  test.each(mismatchedElementErrors)(
    'fails with decoded error when items do not match (%s)',
    (name, input) => {
      const decoder = D.array(D.string);
      expect(decoder(input)).toHaveProperty('failure');
    }
  );
});

describe('D.enumValue', () => {
  describe('with simple typescript enum', () => {
    enum TEST_ENUM {
      foo,
      bar = 3,
      baz,
    }

    it('successfully decodes numbers to enum values', () => {
      const decoder = D.enumValue(TEST_ENUM);
      expect(decoder(0)).toEqual(ok(TEST_ENUM.foo));
      expect(decoder(3)).toEqual(ok(TEST_ENUM.bar));
      expect(decoder(4)).toEqual(ok(TEST_ENUM.baz));
    });

    it('successfully decodes strings to enum values', () => {
      const decoder = D.enumValue(TEST_ENUM);
      expect(decoder('foo')).toEqual(ok(TEST_ENUM.foo));
      expect(decoder('bar')).toEqual(ok(TEST_ENUM.bar));
      expect(decoder('baz')).toEqual(ok(TEST_ENUM.baz));
    });

    it('fails if number does not map to enum range', () => {
      const decoder = D.enumValue(TEST_ENUM);
      expect(decoder(2)).toEqual(failure('Not an enum value'));
    });

    it('fails if string does not map to enum range', () => {
      const decoder = D.enumValue(TEST_ENUM);
      expect(decoder('what')).toEqual(failure('Not an enum value'));
    });
  });
});

describe('D.optional(decoder)', () => {
  const cases: [string, D.Decoder<any>, any][] = [
    ['string', D.string, 'input'],
    ['number', D.number, 123],
    ['literal', D.literal('v'), 'v'],
  ];
  test.each(cases)(
    'transform decoder (%s) to allow undefined values',
    (name, decoder, input) => {
      const optional = D.optional(decoder);
      expect(optional(input)).toEqual(ok(input));
      expect(optional(undefined)).toEqual(ok(undefined));
    }
  );

  test.each(cases)(
    'transformed decoder (%s) does not allow null values',
    (name, decoder, input) => {
      const optional = D.optional(decoder);
      expect(optional(input)).toEqual(ok(input));
      expect(optional(null)).toHaveProperty('failure');
    }
  );
});

describe('D.nullable(decoder)', () => {
  const cases: [string, D.Decoder<any>, any][] = [
    ['string', D.string, 'input'],
    ['number', D.number, 123],
    ['literal', D.literal('v'), 'v'],
  ];
  test.each(cases)(
    'transform decoder (%s) to allow undefined values',
    (name, decoder, input) => {
      const nullableDecoder = D.nullable(decoder);
      expect(nullableDecoder(input)).toEqual(ok(input));
      expect(nullableDecoder(null)).toEqual(ok(null));
    }
  );

  test.each(cases)(
    'transformed decoder (%s) does not allow undefined values',
    (name, decoder, input) => {
      const nullableDecoder = D.nullable(decoder);
      expect(nullableDecoder(input)).toEqual(ok(input));
      expect(nullableDecoder(undefined)).toHaveProperty('failure');
    }
  );
});

describe('D.union', () => {
  describe('with simple union of two objects', () => {
    const decoder = D.union([
      D.object({ type: D.literal('cat'), meow: D.string }),
      D.object({ type: D.literal('dog'), bark: D.string }),
    ]);

    it('successfully decodes either object', () => {
      const cat = { type: 'cat', meow: 'hello' };
      expect(decoder(cat)).toEqual(ok(cat));
      const dog = { type: 'dog', bark: 'wolf' };
      expect(decoder(dog)).toEqual(ok(dog));
    });
    it('strips additional properties which do not match one of the unions', () => {
      const cat = { type: 'cat', meow: 'hello', bark: 'wolf' };
      expect(decoder(cat)).toEqual(ok({ type: 'cat', meow: 'hello' }));
    });

    const failureCases: [string, any][] = [
      ['completely non matching object', { type: 'bird', chirp: 'beep' }],
      ['partial match', { type: 'cat', bark: 'beep' }],
      ['string', 'string'],
      ['number', 123],
      ['null', null],
      ['undefined', undefined],
    ];

    test.each(failureCases)('fails with decoder error (%s)', (name, input) => {
      expect(decoder(input)).toHaveProperty('failure');
    });
  });

  describe('with union of number or string', () => {
    const decoder = D.union([D.string, D.number]);
    it('successfully decodes string input', () => {
      expect(decoder('hello')).toEqual(ok('hello'));
    });
    it('successfully decodes number input', () => {
      expect(decoder(2)).toEqual(ok(2));
    });

    const failureCases: [string, any][] = [
      ['object', { type: 'cat', bark: 'beep' }],
      ['null', null],
      ['undefined', undefined],
    ];

    test.each(failureCases)('fails with decoder error (%s)', (name, input) => {
      expect(decoder(input)).toHaveProperty('failure');
    });
  });
});

describe('D.intersection', () => {
  describe('intersection of multiple simple objects', () => {
    const decoder = D.intersection([
      D.object({ a: D.number, b: D.string }),
      D.object({ c: D.string, b: D.string }),
      D.object({ c: D.string, f: D.string }),
    ]);

    it('successfully decode exact match', () => {
      const value = { a: 1, b: 'bee', c: 'cee', f: 'eff' };
      expect(decoder(value)).toEqual(ok(value));
    });

    it('strips extra properties from input value', () => {
      const value = { a: 1, b: 'bee', c: 'cee', f: 'eff', extra: 'value' };
      const expected = { a: 1, b: 'bee', c: 'cee', f: 'eff' };
      expect(decoder(value)).toEqual(ok(expected));
    });

    const failureCases: [string, any][] = [
      ['non intersecting', { type: 'cat', bark: 'beep' }],
      ['null', null],
      ['string', 'string'],
      ['number', 123],
      ['undefined', undefined],
    ];
    test.each(failureCases)('return decoder error (%s)', (name, input) => {
      expect(decoder(input)).toHaveProperty('failure');
    });
  });

  describe('intersection of literal and string', () => {
    const decoder = D.intersection([D.literal('a'), D.string]);

    it('successfully decode exact match', () => {
      const value = 'a';
      expect(decoder(value)).toEqual(ok(value));
    });

    const failureCases: [string, any][] = [
      ['non intersecting', { type: 'cat', bark: 'beep' }],
      ['null', null],
      ['string', 'string'],
      ['number', 123],
      ['undefined', undefined],
    ];
    test.each(failureCases)('returns decoder error (%s)', (name, input) => {
      expect(decoder(input)).toHaveProperty('failure');
    });
  });

  describe('intersection of deep objects', () => {
    const decoder = D.intersection([
      D.object({ a: D.object({ b: D.string }) }),
      D.object({ a: D.object({ c: D.string }) }),
    ]);

    it('successfully decode exact match', () => {
      const value = { a: { b: 'bee', c: 'cee' } };
      expect(decoder(value)).toEqual(ok(value));
    });

    // Note: this is a limitation of the current implementation.
    // TODO: fix this test.
    it.skip('strips extra properties from deep object', () => {
      const value = { a: { b: 'bee', c: 'cee', extra: 'value' } };
      expect(decoder(value)).toEqual(ok({ a: { b: 'bee', c: 'cee' } }));
    });

    const failureCases: [string, any][] = [
      ['non intersecting', { type: 'cat', bark: 'beep' }],
      ['null', null],
      ['string', 'string'],
      ['number', 123],
      ['undefined', undefined],
    ];
    test.each(failureCases)('returns decoder error (%s)', (name, input) => {
      expect(decoder(input)).toHaveProperty('failure');
    });
  });

  describe('impossible intersection', () => {
    const decoder = D.intersection([D.string, D.number]);
    const failureCases: [string, any][] = [
      ['object', { type: 'cat', bark: 'beep' }],
      ['null', null],
      ['string', 'string'],
      ['number', 123],
      ['undefined', undefined],
    ];
    test.each(failureCases)('return decoder error (%s)', (name, input) => {
      expect(decoder(input)).toHaveProperty('failure');
    });
  });
});

describe('D.compose', () => {
  const dateDecoder: Decoder<Date, string> = (i) => {
    const date = new Date(i);
    if (date instanceof Date && !isNaN(date.getTime())) {
      return ok(date);
    }
    return failure('Not a date like object');
  };
  const hoursDecoder: Decoder<number, Date> = (i) => {
    return ok(i.getHours());
  };
  const evenNumberDecoder: Decoder<number, number> = (i) => {
    if (i % 2 === 0) return ok(i);
    return failure('Uneven number');
  };

  it('does not call following decoders after first failure', () => {
    const dateDecoderSpy = jest.fn().mockImplementation(dateDecoder);
    const hoursDecoderSpy = jest.fn().mockImplementation(hoursDecoder);
    const decoder = D.compose(
      D.string,
      dateDecoderSpy,
      hoursDecoderSpy,
    );
    const result = decoder('hello');
    expect(result).toHaveProperty('failure');
    expect(dateDecoderSpy).toHaveBeenCalledTimes(1);
    expect(dateDecoderSpy).toHaveBeenCalledWith('hello');
    expect(hoursDecoderSpy).toHaveBeenCalledTimes(0);
  });

  describe('multiple composed decoders (a date with even hour)', () => {
    const decoder = D.compose(
      D.string,
      dateDecoder,
      hoursDecoder,
      evenNumberDecoder
    );

    const okCases: [string, unknown, number][] = [
      ['10am on 01-03-2000', new Date(2000, 2, 1, 10).toISOString(), 10],
      ['10pm on 11-12-2023', new Date(2023, 11, 11, 22).toISOString(), 22],
    ];

    test.each(okCases)(
      'successfully decodes a date with even hour (%s)',
      (name, input, expected) => {
        const result = decoder(input);
        expect(result).toEqual(ok(expected));
      }
    );

    const unevenDateString = new Date(2000, 2, 1, 11).toISOString();
    const failureCases: [string, unknown][] = [
      ['object', { type: 'cat', bark: 'beep' }],
      ['null', null],
      ['non-date-like-string', 'string'],
      ['uneven-date-like-string', unevenDateString],
      ['number', 1232345],
      ['undefined', undefined],
    ];

    test.each(failureCases)('return decoder error (%s)', (name, input) => {
      expect(decoder(input)).toHaveProperty('failure');
    });
  });
});
