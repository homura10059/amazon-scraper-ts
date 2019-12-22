import { wishListUrl, Goods } from '.'
import { concurrentPromise } from './util'
import {
  getLinkListFromUrl,
  getGoodsFromUrl,
  getPublishInputFromGoods
} from './amazon'
import { browserUtil } from './scraper'
import { publish } from './sns'

export type Event = {
  urls: string[]
}

export default async (event: Event): Promise<string> => {
  const wishListUrls: wishListUrl[] = event.urls
  const util = browserUtil()
  const browser = await util.get()

  const result = await getLinkListFromUrl(browser, wishListUrls) // wishListUrl[] -> goodsUrl[]
    .then(goodsUrls =>
      goodsUrls.map(url => getGoodsFromUrl.bind(null, browser, url))
    ) // goodsUrl[] -> Goods[]
    .then(goods => concurrentPromise<Goods>(goods, 3))
    .then(goods => goods.filter(good => Boolean(good)))
    .then(goods => goods.map(getPublishInputFromGoods)) // Goods[] -> PublishInput[]
    .then(inputs => Promise.all(inputs))
    .then(inputs => inputs.filter(input => Boolean(input)))
    .then(inputs => inputs.map(publish))
    .then(results => Promise.all(results))
    .then(_ => util.close())
  console.log(result)

  return 'send message'
}
