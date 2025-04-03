const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function generateAmazonURL(query) {
    const formattedQuery = query.split(" ").join("+");
    return `https://www.amazon.in/s?k=${formattedQuery}`;
}

const userQuery = 'ps4';

(async () => {
    const browser = await chromium.launch({ headless: true }); // Set to true if you don't want UI
    const page = await browser.newPage();

    // Set user agent to bypass bot detection
    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const url = generateAmazonURL(userQuery);

    console.log('⏳ Loading page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for product listings to appear
    await page.waitForSelector('.s-main-slot', { timeout: 10000 });

    console.log('✅ Page Loaded. Extracting products...');

    const products = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('.s-main-slot .s-result-item').forEach((product) => {
            const nameElement = product.querySelector('.a-size-medium.a-color-base.a-text-normal');
            const priceElement = product.querySelector('.a-price-whole');

            if (nameElement && priceElement) {
                items.push({
                    name: nameElement.innerText.trim(),
                    price: `₹${priceElement.innerText.trim()}`
                });
            }
        });
        return items;
    });

    await browser.close();

    if (products.length === 0) {
        console.log('❌ No products found! Amazon might have changed its structure or blocked scraping.');
        return;
    }

    // Save to CSV file
    // const csvContent = 'Name,Price\n' + products.map(p => `"${p.name}","${p.price}"`).join('\n');
    // const filePath = path.join(__dirname, 'amazon_prices.csv');
    // fs.writeFileSync(filePath, csvContent, 'utf8');
    // console.log(`✅ Data saved to ${filePath}`);

    // Display in terminal
    console.log('📦 Scraped Products:');
    console.table(products);
})();
