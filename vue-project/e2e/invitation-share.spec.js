import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import QRCode from 'qrcode'
import { signIn } from './support/session.js'

/**
 * INV-702 — sharing the published invitation from the success screen: copy
 * link (Clipboard API, and the fallback when it is refused), a downloadable QR
 * code that encodes exactly the public guest link, and the native share sheet
 * when the browser has one. Never a private or administrative link.
 */

const USER = '77777777-7777-7777-7777-777777777777'
const EVENT = '99999999-9999-9999-9999-999999999999'
const REF = 'ab12cd34ef'
const SCRATCH = 'C:/Users/techl/AppData/Local/Temp/claude/C--Projcets-ZM/17a780c3-35a7-45d6-9961-af0c146a2596/scratchpad'

const origin = () => new URL(test.info().project.use.baseURL).origin
const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })
const publication = (publicUrl) => ({
  paymentStatus: 'SUCCESS', eventId: EVENT, eventStatus: 'ACTIVE', published: true, publicUrl, design: 'coastal-breeze',
})

async function openPublished(page, publicUrl) {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  await page.route('**/v1/api/**', (route) => route.fulfill(json({ success: true, data: null })))
  await page.route('**/public/invitation-page/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await page.route(`**/v1/api/payments/${REF}/publication`, (route) => route.fulfill(json(publication(publicUrl))))
  await signIn(page, { userId: USER, eventId: EVENT, lang: 'mk', roles: ['USER'] })
  await page.goto(`/mk/payment/result?ref=${REF}`)
  await expect(page.getByTestId('payment-result-title')).toHaveText('Вашата покана е објавена')
}

/** Reads the QR image back into its module matrix (dark = true). */
async function qrMatrixOnPage(page, size, margin, scale) {
  return page.getByTestId('qr-image').evaluate(async (img, { size, margin, scale }) => {
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const rows = []
    for (let r = 0; r < size; r++) {
      const row = []
      for (let c = 0; c < size; c++) {
        const x = (margin + c) * scale + scale / 2
        const y = (margin + r) * scale + scale / 2
        row.push(ctx.getImageData(x, y, 1, 1).data[0] < 128)
      }
      rows.push(row)
    }
    return { rows, width: img.naturalWidth }
  }, { size, margin, scale })
}

function expectedMatrix(text) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const rows = []
  for (let r = 0; r < modules.size; r++) {
    const row = []
    for (let c = 0; c < modules.size; c++) row.push(!!modules.get(r, c))
    rows.push(row)
  }
  return { size: modules.size, rows }
}

test.describe('INV-702 copy link and QR code', () => {
  test('desktop: copy puts the public link on the clipboard; the QR encodes exactly it and downloads as PNG', async ({ page, context, browser }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const publicUrl = `${origin()}/mk/invitations/coastal-breeze?eventId=${EVENT}`
    await openPublished(page, publicUrl)

    const share = page.getByTestId('invitation-share')
    await expect(share.getByRole('heading', { name: 'Споделете ја поканата' })).toBeVisible()

    // Copy link → clipboard + polite confirmation.
    const copy = page.getByTestId('copy-link')
    await expect(copy).toHaveAccessibleName('Копирај линк')
    await copy.click()
    await expect(page.getByTestId('share-status')).toHaveText('Линкот е копиран')
    await expect(copy).toHaveText(/Линкот е копиран/)
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(publicUrl)

    // The QR, read back pixel by pixel, is the QR of exactly this link.
    const qr = page.getByRole('img', { name: 'QR-код на јавниот линк до поканата' })
    await expect(qr).toBeVisible()
    const expected = expectedMatrix(publicUrl)
    const onPage = await qrMatrixOnPage(page, expected.size, 4, 8)
    expect(onPage.width).toBe((expected.size + 8) * 8)
    expect(onPage.rows).toEqual(expected.rows)
    // …and not of the private link or the editor address.
    expect(onPage.rows).not.toEqual(expectedMatrix(publicUrl.replace('coastal-breeze?', 'coastal-breeze/private?')).rows)

    // Download.
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('qr-download').click()])
    expect(download.suggestedFilename()).toBe('ivy-invitation-qr-99999999.png')
    const saved = `${SCRATCH}/inv702-qr-download.png`
    await download.saveAs(saved)
    expect(readFileSync(saved).subarray(1, 4).toString()).toBe('PNG')
    await page.screenshot({ path: `${SCRATCH}/inv702-share-1280.png`, fullPage: true })

    // What the scan opens: the guest invitation, without any organizer session.
    const guest = await browser.newContext()
    const guestPage = await guest.newPage()
    await guestPage.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
    await guestPage.route('**/public/invitation-page/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    await guestPage.goto(publicUrl)
    await expect(guestPage.getByText(/Допрете за отворање/)).toBeVisible()
    await expect(guestPage).toHaveURL(publicUrl)
    await guest.close()
  })

  test('phone: native share sheet with just the link; copy falls back when the Clipboard API refuses', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    // A browser with a share sheet, and a Clipboard API that refuses to write.
    await page.addInitScript(() => {
      window.__shared = []
      Object.defineProperty(navigator, 'share', { configurable: true, value: async (data) => { window.__shared.push(data) } })
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
      navigator.clipboard.writeText = () => Promise.reject(new DOMException('denied', 'NotAllowedError'))
    })
    const publicUrl = `${origin()}/mk/invitations/coastal-breeze?eventId=${EVENT}`
    await openPublished(page, publicUrl)

    const shareBtn = page.getByRole('button', { name: 'Сподели…' })
    await shareBtn.click()
    expect(await page.evaluate(() => window.__shared)).toEqual([{ title: 'Покана', url: publicUrl }])

    const copy = page.getByTestId('copy-link')
    await copy.click()
    await expect(page.getByTestId('share-status')).toHaveText('Линкот е копиран')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(publicUrl)
    await expect(copy).toBeFocused()

    for (const id of ['copy-link', 'native-share', 'qr-download']) {
      expect((await page.getByTestId(id).boundingBox()).height).toBeGreaterThanOrEqual(44)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await page.getByTestId('invitation-share').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${SCRATCH}/inv702-share-390.png`, fullPage: true })
  })

  test('copy that cannot work at all: an alert and the link selected for copying by hand', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
      document.execCommand = () => false
    })
    const publicUrl = `${origin()}/mk/invitations/coastal-breeze?eventId=${EVENT}`
    await openPublished(page, publicUrl)

    await page.getByRole('button', { name: 'Копирај линк' }).click()
    await expect(page.getByRole('alert')).toContainText('Не успеавме автоматски да го копираме')
    const field = page.getByLabel('Јавен линк до поканата')
    await expect(field).toBeFocused()
    expect(await field.evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(publicUrl)
    await expect(page.getByTestId('share-status')).toHaveText('')
    await page.screenshot({ path: `${SCRATCH}/inv702-copy-failed-390.png` })
  })

  test('a private link from the server is never offered to copy, encode or share', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const privateUrl = `${origin()}/mk/invitations/coastal-breeze/private?eventId=${EVENT}`
    await openPublished(page, privateUrl)
    await expect(page.getByTestId('public-url-missing')).toBeVisible()
    await expect(page.getByTestId('invitation-share')).toHaveCount(0)
    await expect(page.getByTestId('qr-image')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Копирај линк' })).toHaveCount(0)
  })
})
