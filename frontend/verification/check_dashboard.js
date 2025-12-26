const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function checkDashboard() {
  console.log('Starting dashboard verification...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set viewport for full dashboard view
    await page.setViewport({ width: 1920, height: 1080 });

    // Collect console messages
    const consoleMessages = [];
    const errors = [];

    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    page.on('pageerror', error => {
      errors.push(error.toString());
    });

    console.log('Navigating to http://localhost:3001...');

    // Navigate to the dashboard
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Page loaded, waiting for content to render...\n');

    // Wait a bit more for React to hydrate and render
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take full page screenshot
    const screenshotPath = path.join(__dirname, 'session61_initial_check.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`✓ Screenshot saved to: ${screenshotPath}\n`);

    // Check for key metrics
    console.log('Checking for 6 key metrics...');
    const metrics = await page.evaluate(() => {
      const metricElements = document.querySelectorAll('[class*="metric"]');
      const results = [];

      // Look for specific metric cards or containers
      const possibleSelectors = [
        '.metric-card',
        '[data-metric]',
        'div[class*="metric"]',
        'div[class*="card"]'
      ];

      let allMetrics = [];
      for (const selector of possibleSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent;
          if (text && text.trim()) {
            allMetrics.push({
              selector: selector,
              text: text.substring(0, 100)
            });
          }
        });
      }

      // Also look for specific metric names
      const metricNames = [
        'Bitcoin Funding Rate',
        'Funding Rate',
        'Fed Net Liquidity',
        'Stablecoin Supply',
        'Bitcoin Dominance',
        'Altcoin Season Index',
        'Exchange Reserves'
      ];

      const foundMetrics = [];
      metricNames.forEach(name => {
        const found = document.body.textContent.includes(name);
        if (found) {
          foundMetrics.push(name);
        }
      });

      return {
        allMetrics: allMetrics.slice(0, 20),
        foundMetricNames: foundMetrics,
        bodyText: document.body.textContent.substring(0, 500)
      };
    });

    console.log(`Found metric names: ${metrics.foundMetricNames.join(', ')}`);
    console.log(`Total metric-like elements found: ${metrics.allMetrics.length}\n`);

    // Check for Smart Money Radar
    console.log('Checking for Smart Money Radar...');
    const smartMoneyRadar = await page.evaluate(() => {
      const hasSmartMoneyText = document.body.textContent.includes('Smart Money Radar');
      const hasRadarEvents = document.body.textContent.includes('Events') ||
                            document.body.textContent.includes('event');

      // Look for event items
      const eventElements = document.querySelectorAll('[class*="event"]');

      return {
        hasSmartMoneyText,
        hasRadarEvents,
        eventElementCount: eventElements.length,
        sampleText: document.body.textContent.substring(0, 1000)
      };
    });

    if (smartMoneyRadar.hasSmartMoneyText) {
      console.log(`✓ Smart Money Radar section found`);
      console.log(`  - Event elements: ${smartMoneyRadar.eventElementCount}`);
    } else {
      console.log(`✗ Smart Money Radar section NOT found`);
    }
    console.log('');

    // Check for Catalyst Calendar
    console.log('Checking for Catalyst Calendar...');
    const catalystCalendar = await page.evaluate(() => {
      const hasCatalystText = document.body.textContent.includes('Catalyst Calendar') ||
                             document.body.textContent.includes('Calendar');
      const hasCalendarEvents = document.body.textContent.includes('catalyst') ||
                               document.body.textContent.includes('event');

      return {
        hasCatalystText,
        hasCalendarEvents
      };
    });

    if (catalystCalendar.hasCatalystText) {
      console.log(`✓ Catalyst Calendar section found`);
    } else {
      console.log(`✗ Catalyst Calendar section NOT found`);
    }
    console.log('');

    // Check for console errors
    console.log('Browser console messages:');
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');

    if (errorMessages.length > 0) {
      console.log(`\n✗ ${errorMessages.length} console errors found:`);
      errorMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.text}`);
      });
    } else {
      console.log('✓ No console errors');
    }

    if (warningMessages.length > 0) {
      console.log(`\n⚠ ${warningMessages.length} console warnings found:`);
      warningMessages.slice(0, 5).forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.text}`);
      });
      if (warningMessages.length > 5) {
        console.log(`  ... and ${warningMessages.length - 5} more warnings`);
      }
    }

    if (errors.length > 0) {
      console.log(`\n✗ ${errors.length} page errors found:`);
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    console.log('\n--- Summary ---');
    console.log(`Metrics found: ${metrics.foundMetricNames.length}/6`);
    console.log(`Smart Money Radar: ${smartMoneyRadar.hasSmartMoneyText ? 'Yes' : 'No'}`);
    console.log(`Catalyst Calendar: ${catalystCalendar.hasCatalystText ? 'Yes' : 'No'}`);
    console.log(`Console Errors: ${errorMessages.length}`);
    console.log(`Page Errors: ${errors.length}`);
    console.log(`Screenshot: ${screenshotPath}`);

    // Get page HTML for debugging
    const html = await page.content();
    const htmlPath = path.join(__dirname, 'page_content.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`\nPage HTML saved to: ${htmlPath}`);

  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the check
checkDashboard().catch(error => {
  console.error('Failed to check dashboard:', error);
  process.exit(1);
});
