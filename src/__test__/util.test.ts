import { pipe } from 'fp-ts/lib/pipeable'
import { peek } from '../util'

describe('util', () => {
  describe('peek', () => {
    it('return same value', async () => {
      const addEnd = (s: string) => s + 'end'
      const init: string = ''
      const actual = pipe(
        init,
        peek,
        addEnd
      )
      expect(actual).toBe(init + 'end')
    })
  })
})
