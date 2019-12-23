import puppeteer, { Browser, Page } from 'puppeteer-core'
import { log } from 'fp-ts/lib/Console'
import chromium from 'chrome-aws-lambda'
import { pipe } from 'fp-ts/lib/pipeable'
import * as T from 'fp-ts/lib/Task'

const scrollPageToBottom = require('puppeteer-autoscroll-down')

export const scrape = async (browser: Browser, url: string): Promise<Page> => {
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: ['networkidle0'], timeout: 300000 })
  await scrollPageToBottom(page)
  return page
}

export const getBrowser: T.Task<Browser> = (() => {
  let browser: Promise<Browser> | null = null
  return async () => {
    if (!browser) {
      const path = process.env.LOCAL
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : await chromium.executablePath

      browser = puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: path
      })
    }
    return browser
  }
})()