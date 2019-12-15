import puppeteer, { Browser, Page } from 'puppeteer-core'
import { log } from 'fp-ts/lib/Console'
import chromium from 'chrome-aws-lambda'
import { CHROME_UA } from '.'
import { pipe } from 'fp-ts/lib/pipeable'

const scrollPageToBottom = require('puppeteer-autoscroll-down')

export const scrape = async (browser: Browser, url: string): Promise<Page> => {
  const page = await newPage(browser)

  await page.goto(url, { waitUntil: ['networkidle0'], timeout: 300000 })
  await scrollPageToBottom(page)

  return page
}

export function browserUtil() {
  let browser: Promise<Browser> | null = null

  return {
    async get() {
      const path = process.env.LOCAL
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : await chromium.executablePath

      browser = puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: path
      })
      return browser
    },
    async close() {
      if (browser) {
        await (await browser).close()
        browser = null
      }
    },
  }
}

const newPage = (browser: Browser) => {
  return browser.newPage().then(async page => {
    await page.setUserAgent(CHROME_UA)
    return page
  })
}
