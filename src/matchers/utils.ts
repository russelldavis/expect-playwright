import { Page, HTMLOrSVGElementHandle, PageWaitForSelectorOptions, WaitForSelectorOptionsNotHidden } from "playwright-core"

const ExpectTypePage = "Page"
const ExpectTypeElementHandle = "ElementHandle"

type ExpectType = typeof ExpectTypePage | typeof ExpectTypeElementHandle

export type ExpectInputType = Page | HTMLOrSVGElementHandle

export const detectExpectType = (value: ExpectInputType): ExpectType => {
  const className = value.constructor.name
  switch (className) {
    case "Page":
      return ExpectTypePage
    case "ElementHandle":
      return ExpectTypeElementHandle
    default:
      throw new Error(`could not recognize type: ${className}`)
  }
}

interface getElementTextReturn {
  elementHandle: HTMLOrSVGElementHandle
  selector?: string
  expectedValue: string
}

export type InputArguments = [Page | HTMLOrSVGElementHandle, string?, (string | PageWaitForSelectorOptions)?, PageWaitForSelectorOptions?]

export const getDefaultWaitForSelectorOptions = (options: PageWaitForSelectorOptions = {}): PageWaitForSelectorOptions => ({
  timeout: 1 * 1000,
  ...options
})

export const getElementText = async (...args: InputArguments): Promise<getElementTextReturn> => {
  /**
  * Handle the following cases:
  * - expect(page).foo("bar")
  * - expect(element).foo("bar")
  */
  if (args.length === 2) {
    const type = detectExpectType(args[0])
    if (type === ExpectTypeElementHandle) {
      return {
        elementHandle: args[0] as HTMLOrSVGElementHandle,
        expectedValue: args[1] as string
      }
    }
    const page = args[0] as Page
    return {
      elementHandle: await page.$("body") as HTMLOrSVGElementHandle,
      expectedValue: args[1] as string
    }
  }
  /**
   * Handle the following case:
   * - expect(page).foo("#foo", "bar")
   */
  if (args.length === 3) {
    const selector = args[1] as string
    const page = args[0] as Page
    const options = getDefaultWaitForSelectorOptions(args[3] as WaitForSelectorOptionsNotHidden)
    try {
      await page.waitForSelector(selector, options)
    } catch (err) {
      throw new Error(`Timeout exceed for element ${quote(selector)}`)
    }
    return {
      elementHandle: await page.$(selector) as HTMLOrSVGElementHandle,
      expectedValue: args[2] as string,
      selector
    }
  }
  throw new Error(`Invalid input length: ${args.length}`)
}

export const quote = (val: string | null) => `'${val}'`