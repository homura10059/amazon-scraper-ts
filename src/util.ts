export const randomSleep = () => {
  const time = Math.floor(Math.random() * 1000)
  return sleep(time)
}

const sleep = (msec: number) => {
  return new Promise(resolve => setTimeout(resolve, msec))
}

export const peek = <A>(x: A) => {
  console.log(x)
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
