const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: false }); // Set to true for headless mode

    // Create a new browser context with a custom User-Agent
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    const url = 'https://www.news18.com/news/page-2/';

    await page.goto(url, { waitUntil: 'load', timeout: 30000 }); // Wait until the page is fully loaded

    // Wait for news items to appear
    await page.waitForSelector('li.jsx-1976791735', { timeout: 20000 });

    // Extract news data
    const articles = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('li.jsx-1976791735').forEach((newsItem) => {
            const titleElement = newsItem.querySelector('figcaption.jsx-1976791735');
            const linkElement = newsItem.querySelector('a.jsx-1976791735');

            if (titleElement && linkElement) {
                items.push({
                    title: titleElement.innerText.trim(),
                    link: "https://www.news18.com" + linkElement.getAttribute('href')
                });
            }
        });
        return items;
    });

    await browser.close();

    if (articles.length === 0) {
        console.log('No articles found! The website structure may have changed.');
        return;
    }

    // Save to CSV file
    // const csvContent = 'Title,Link\n' + articles.map(a => `"${a.title}","${a.link}"`).join('\n');
    // const filePath = path.join(__dirname, 'news18_articles.csv');
    // fs.writeFileSync(filePath, csvContent, 'utf8');
    // console.log(`✅ Data saved to ${filePath}`);

    // Display in terminal
    console.log('📰 Scraped Articles:');
    console.table(articles);
})();
