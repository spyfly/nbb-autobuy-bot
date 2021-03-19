const { chromium } = require('playwright');
const fs = require('fs');
const amazonPay = require("../payment_gateways/amazon_pay.js")

async function autoBuy(config, deal) {
  var sucess = true;
  const context = await chromium.launchPersistentContext('/tmp/rtx-3000-autobuy-bot/', { headless: true, recordVideo: { dir: './videos/' } });
  const page = await context.newPage();
  const videoPath = await page.video().path();
  try {
    console.log("Finished Setup!");

    await page.goto(deal.href + '/action/add_product');

    console.log("Step 1: Adding Item to Cart");

    console.log("Step 2.1: Going to Checkout");
    await page.goto('https://www.notebooksbilliger.de/kasse/anmelden/cartlayer/1')

    console.log("Step 2.2: Clicking away cookies banner");
    try {
      await page.click('#uc-btn-accept-banner', { timeout: 500 })
    } catch { }

    console.log("Step 3.1: Starting Amazon Pay")
    await page.click('#loginWithAmazon');

    context.on('page', async (amazonPayPopup) => {
      await amazonPay(amazonPayPopup, config.payment_gateways.amazon)
    });

    //Wait for Checkout Page to load
    await page.waitForNavigation();

    if (config.general.debug) {
      await page.screenshot({ path: 'debug_checkout_1.png' });
    }

    console.log("Step 4.1: Starting Checkout Process")
    await page.click('#amazon-pay-to-checkout');

    //Filling in phone and confirming shipping
    console.log("Step 4.2: Filling in Phone Number and confirming shipping")
    await page.fill('[name="newbilling[telephone]"]', config.shops.nbb.phone_number)
    await page.click('[for="conditions"]', {
      position: {
        x: 10, y: 10
      }
    });

    await page.click('#button_bottom');

    //Final Checkout
    console.log("Step 4.3: Finalizing Checkout")
    if (config.shops.nbb.checkout) {
      await page.click('checkout_submit');
    }
  } catch (err) {
    sucess = false;
  }

  await context.close();
  return {
    success: sucess,
    videoPath: videoPath
  }
}
module.exports = autoBuy;