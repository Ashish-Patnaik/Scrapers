const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');

chromium.use(stealth()); // Enable stealth mode

function generateFlipkartURL(query) {
    const formattedQuery = query.split(" ").join("+");
    return `https://www.flipkart.com/search?q=${formattedQuery}`;
}

const userQuery = 'samsung'; // Try different queries like 'chair', 'sofa'

(async () => {
    const browser = await chromium.launch({ headless: true }); // Run in visible mode
    const page = await browser.newPage();
    const url = generateFlipkartURL(userQuery);

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Scroll down to load more products
    for (let i = 0; i < 5; i++) {  // Increase scroll attempts
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(3000); // Wait 3 seconds for content to load
    }

    // Define updated selectors
    const selectors = {
        title: [
            'a .wjcEIp', 
            '.KzDlHZ', 
            '.s1Q9rs', 
            '.IRpwTa', 
            '._4rR01T'
        ],
        price: [
            '.Nx9bqj._4b5DiR', 
            '._30jeq3', 
            '._1_WHN1'
        ]
    };

    try {
        // Ensure at least one product is present
        await page.waitForSelector('div[data-id]', { timeout: 20000 });

        // Extract product details
        const products = await page.evaluate((selectors) => {
            const items = [];
            document.querySelectorAll('div[data-id]').forEach((product) => {
                let nameElement = null;
                let priceElement = null;

                // Try different title class names
                for (let selector of selectors.title) {
                    nameElement = product.querySelector(selector);
                    if (nameElement) break;
                }

                // Try different price class names
                for (let selector of selectors.price) {
                    priceElement = product.querySelector(selector);
                    if (priceElement) break;
                }

                if (nameElement && priceElement) {
                    items.push({
                        name: nameElement.innerText.trim(),
                        price: priceElement.innerText.trim()
                    });
                }
            });
            return items;
        }, selectors);

        if (products.length === 0) {
            console.log('❌ No products found! Flipkart might have changed selectors.');
        } else {
            console.log('✅ Scraped Products:');
            console.table(products);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await browser.close();
})();
