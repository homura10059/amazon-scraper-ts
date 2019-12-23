import { fromNullable, fold } from 'fp-ts/lib/Option'
import { log } from 'fp-ts/lib/Console'
import { pipe } from 'fp-ts/lib/pipeable'

export const peek = <A>(x: A): A => {
  pipe(
    fromNullable(x),
    log
  )()
  return x
}

export const concurrentPromise = async <T>(
  promises: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> => {
  const results: T[] = []
  let currentIndex = 0

  while (true) {
    const chunks = promises.slice(currentIndex, currentIndex + concurrency)
    if (chunks.length === 0) {
      break
    }
    Array.prototype.push.apply(results, await Promise.all(chunks.map(c => c())))
    currentIndex += concurrency
  }
  return results
}
