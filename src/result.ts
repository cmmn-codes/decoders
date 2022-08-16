import { pipe } from './pipe.js';

export type Ok<T> = { readonly type: 'ok'; readonly ok: T };
export type Failure<T> = { readonly type: 'failure'; readonly failure: T };
export type Result<E, R> = Failure<E> | Ok<R>;

export const ok = <E = never, A = never>(v: A): Result<E, A> => ({
  type: 'ok',
  ok: v,
});

export const failure = <E = never, A = never>(v: E): Result<E, A> => ({
  type: 'failure',
  failure: v,
});

export function isOk<T>(r: Result<unknown, T>): r is Ok<T> {
  return r.type === 'ok';
}

export function isFailure<T>(r: Result<T, unknown>): r is Failure<T> {
  return r.type === 'failure';
}

export const map =
  <A, B, E>(f: (a: A) => B) =>
  (v: Result<E, A>): Result<E, B> =>
    isOk(v) ? ok(f(v.ok)) : v;

export const chain =
  <A, B, E>(f: (a: A) => Result<E, B>) =>
  (v: Result<E, A>): Result<E, B> =>
    isOk(v) ? f(v.ok) : v;

export const fold =
  <E, R, O>(onFailure: (i: E) => O, onOk: (i: R) => O) =>
  (r: Result<E, R>) =>
    isOk(r) ? onOk(r.ok) : onFailure(r.failure);

export const sequence = <E, R>(a: Result<E, R>[]): Result<E, R[]> => {
  return a.reduce<Result<E, R[]>>((acc, v) => {
    return pipe(
      acc,
      chain((a) =>
        pipe(
          v,
          map((b) => {
            a.push(b);
            return a;
          })
        )
      )
    );
  }, ok<E, R[]>([]));
};

export const arrayMap =
  <A, B>(fn: (a: A) => B) =>
  (a: A[]): B[] =>
    a.map(fn);
