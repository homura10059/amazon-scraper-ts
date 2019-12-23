export type wishListUrl = string
export type goodsUrl = string

export const TITLE = '#ebooksProductTitle'
export const PRICE =
  '#buybox > div > table > tbody > tr.kindle-price > td.a-color-price.a-size-large.a-align-bottom.a-text-bold > span'
export const SAVING =
  '#buybox > div > table > tbody > tr.savings > td.a-color-base.a-align-bottom'
export const POINTS =
  '#buybox > div > table > tbody > tr.loyalty-points > td.a-align-bottom > div > span > span.a-size-base.a-color-price.a-text-bold'
export const POINTS_PER =
  '#buybox > div > table > tbody > tr.loyalty-points > td.a-align-bottom > div > span > span:nth-child(2)'

export interface Title {
  title?: string
}

export interface Url {
  url?: string
}

export interface Price {
  price?: string
}
export interface Discount {
  discount?: string
}
export interface DiscountPer {
  discountPer?: string
}
export type Saving = Discount & DiscountPer

export interface Points {
  points?: string
}
export interface PointsPer {
  pointsPer?: string
}
export type Goods = Title & Url & Price & Saving & Points & PointsPer

export const priceRegex = /\d{1,3}(,\d{3})*/

export const percentageRegex = /\d{1,3}/
