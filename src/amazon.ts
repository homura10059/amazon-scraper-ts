import {
  wishListUrl,
  goodsUrl,
  Goods,
  Title,
  TITLE,
  Price,
  PRICE,
  priceRegex,
  Saving,
  SAVING,
  percentageRegex,
  Points,
  POINTS,
  PointsPer,
  POINTS_PER
} from '.'
import { scrape } from './scraper'
import { Page, Browser } from 'puppeteer-core'
import { flatten } from 'fp-ts/lib/Array'
import { randomSleep } from './util'
import { PublishInput } from 'aws-sdk/clients/sns'
import AWS from 'aws-sdk'

export const getLinkListFromUrl = async (
  browser: Browser,
  wishListUrls: wishListUrl[]
): Promise<goodsUrl[]> => {
  console.log('wishListUrls', wishListUrls)
  return Promise.all(wishListUrls.map(url => scrape(browser, url)).map(getLinkListFromPage)).then(
    linkArrays => flatten(linkArrays)
  )
}

const getLinkListFromPage = async (pagePromise: Promise<Page>): Promise<string[]> => {
  // on debug
  // await page.screenshot({ path: 'page.png', fullPage: true })
  const page = await pagePromise
  const links = await page.$$eval('a', elements => {
    return elements
      .map(element => element.href)
      .filter((href: string | null) => Boolean(href))
      .filter((href: string) => href.includes('?coliid'))
      .filter((href: string) => href.includes('&ref'))
      .map((href: string) => href.split('?')[0])
  })
  .finally(() => page.close())

  // tslint:disable-next-line: no-any
  return (links as any) as Promise<string[]>
}

export const getGoodsFromUrl = async (
  browser: Browser,
  url: goodsUrl
): Promise<Goods | undefined> => {
  const initialState: Goods = {
    url: url,
    price: undefined,
    discount: undefined,
    discountPer: undefined,
    points: undefined,
    pointsPer: undefined
  }
  const page = await scrape(browser, url)
  console.time('goodsUrl:' + url)
  // await randomSleep()
  const goods = await Promise.all([
    getTitle(page),
    getPrice(page),
    getSaving(page),
    getPoint(page),
    getPointsPer(page)
  ])
    .then(values =>{
      console.timeEnd('goodsUrl:' + url)

      return values.reduce((prev, current) => {
        return { ...prev, ...current }
      }, initialState)
    }
    )
    .catch(err => {
      console.timeEnd('goodsUrl:' + url)
      console.error(err)
      return undefined
    }).finally(() => page.close())

  return goods
}

const getTitle = async (page: Page): Promise<Title> => {
  return getText(page, TITLE).then((title: string) => {
    return {
      title: title
    }
  })
}

const getPrice = async (page: Page): Promise<Price> => {
  return getText(page, PRICE).then((priceStr: string) => {
    const price = priceRegex.exec(priceStr)

    return {
      price: price && price.length > 0 ? price[0] : undefined
    }
  })
}

const getSaving = async (page: Page): Promise<Saving> => {
  return getText(page, SAVING).then((saving: string) => {
    const discount = priceRegex.exec(saving)
    const discountPer = percentageRegex.exec(saving.split('(')[1])
    return {
      discount: discount && discount.length > 0 ? discount[0] : undefined,
      discountPer:
        discountPer && discountPer.length > 0 ? discountPer[0] : undefined
    }
  })
}

const getPoint = async (page: Page): Promise<Points> => {
  return getText(page, POINTS).then((pointsStr: string) => {
    const points = priceRegex.exec(pointsStr)
    return {
      points: points && points.length > 0 ? points[0] : undefined
    }
  })
}

const getPointsPer = async (page: Page): Promise<PointsPer> => {
  return getText(page, POINTS_PER)
    .then((pointsPerStr: string) => {
      const surrounded = pointsPerStr.split('(')
      const pointsPer =
        surrounded && surrounded.length > 1
          ? surrounded[1].split(')')
          : undefined
      return pointsPer && pointsPer.length > 0 ? pointsPer[0] : ''
    })
    .then((pointsPerStr: string) => {
      const pointsPer = percentageRegex.exec(pointsPerStr)
      return {
        pointsPer: pointsPer && pointsPer.length > 0 ? pointsPer[0] : undefined
      }
    })
}

const getText = async (page: Page, selector: string): Promise<string> => {
  return page
    .$(selector)
    .then(element => element.getProperty('textContent'))
    .then(some => some.jsonValue())
    .then(str => (typeof str === 'string' ? str.trim() : ''))
    .catch(_ => '')
}

export const getPublishInputFromGoods = async (
  goods: Goods
): Promise<PublishInput|undefined> => {
  const discountPer = parseInt(goods.discountPer ?? '0', 10)
  const pointsPer = parseInt(goods.pointsPer ?? '0', 10)
  const color = getColor(discountPer, pointsPer)
  if (!color) {
    console.log('(getPublishInputFromGoods)' + goods.title + ':' + undefined)
    return undefined
  }
  const publishInput = {
    Message: `[SALE] ${goods.title}`,
    TopicArn: process.env.TOPIC_ARN,
    MessageAttributes: {
      color: {
        DataType: 'String',
        StringValue: color
      },
      title: {
        DataType: 'String',
        StringValue: goods.title
      },
      title_link: {
        DataType: 'String',
        StringValue: goods.url
      },
      text: {
        DataType: 'String',
        StringValue: `金額: ¥${goods.price}\n値引き率: ${goods.discountPer}%\nポイント還元率: ${goods.pointsPer}%`
      }
    }
  }
  console.log('(getPublishInputFromGoods)' + goods.title + ':', publishInput)
  return publishInput
}

const getColor = (discountPer: number, pointsPer: number): 'good' | 'warning' | 'danger' | undefined => {
  if (discountPer >= 35 || pointsPer >= 30) {
    return 'danger'
  }
  if (discountPer >= 25 || pointsPer >= 20) {
    return 'warning'
  }
  if (discountPer >= 20 || pointsPer >= 15) {
    return 'good'
  }
  return undefined
}

export const publish = (input: PublishInput) => {
  const publisher = getSnsPublisher()
  return publisher.publish(input).promise()
}

const getSnsPublisher = (() => {
  let publisher: AWS.SNS | null = null

  return () => {
    if (!publisher) {
      AWS.config.update({ region: 'ap-northeast-1' })
      publisher = new AWS.SNS({ apiVersion: '2010-03-31' })
    }
    return publisher
  }
})()