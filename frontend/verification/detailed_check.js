const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function detailedCheck() {
  console.log('Starting detailed dashboard verification...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const consoleMessages = [];
    const errors = [];

    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    page.on('pageerror', error => {
      errors.push(error.toString());
    });

    page.on('requestfailed', request => {
      consoleMessages.push({
        type: 'request-failed',
        text: `Failed: ${request.url()} - ${request.failure().errorText}`
      });
    });

    console.log('Navigating to http://localhost:3001...\n');
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract all metric information
    const metricData = await page.evaluate(() => {
      const metrics = [];

      // Find all metric cards
      const metricTexts = [
        'US 10Y Treasury Yield',
        'Fed Net Liquidity',
        'Bitcoin Price',
        'Stablecoin Market Cap',
        'USDT Dominance',
        'RWA TVL',
        'Bitcoin Dominance',
        'Altcoin Season Index',
        'Exchange Reserves',
        'Funding Rate'
      ];

      metricTexts.forEach(name => {
        if (document.body.textContent.includes(name)) {
          // Try to find the value near the metric name
          const elements = document.querySelectorAll('h3, div, span');
          for (let el of elements) {
            if (el.textContent.includes(name)) {
              // Look for the value in nearby elements
              let parent = el.closest('div.p-6, div.p-8');
              if (parent) {
                const valueElement = parent.querySelector('.text-3xl, .text-5xl');
                const value = valueElement ? valueElement.textContent.trim() : 'NOT FOUND';
                const subtitle = parent.querySelector('.text-xs.text-gray-500');
                const subtitleText = subtitle ? subtitle.textContent.trim() : '';

                metrics.push({
                  name: name,
                  value: value,
                  subtitle: subtitleText,
                  found: true
                });
                break;
              }
            }
          }
        }
      });

      return {
        metrics,
        hasSmartMoneyRadar: document.body.textContent.includes('Smart Money Radar'),
        hasCatalystCalendar: document.body.textContent.includes('Catalyst Calendar'),
        hasRiskOffIndicator: document.body.textContent.includes('Risk Off'),
        polymarketEventCount: document.querySelectorAll('a[href*="polymarket.com"]').length,
        calendarEventCount: (document.body.textContent.match(/Dec \d+/g) || []).length
      };
    });

    console.log('=== METRIC VERIFICATION ===\n');
    metricData.metrics.forEach((metric, index) => {
      console.log(`${index + 1}. ${metric.name}`);
      console.log(`   Subtitle: ${metric.subtitle}`);
      console.log(`   Value: ${metric.value}`);
      console.log('');
    });

    console.log(`Total metrics found: ${metricData.metrics.length}\n`);

    console.log('=== DASHBOARD COMPONENTS ===\n');
    console.log(`Smart Money Radar: ${metricData.hasSmartMoneyRadar ? 'YES' : 'NO'}`);
    console.log(`  - Polymarket events displayed: ${metricData.polymarketEventCount}`);
    console.log('');
    console.log(`Catalyst Calendar: ${metricData.hasCatalystCalendar ? 'YES' : 'NO'}`);
    console.log(`  - Calendar events found: ${metricData.calendarEventCount}`);
    console.log('');
    console.log(`Risk Indicator: ${metricData.hasRiskOffIndicator ? 'RISK OFF' : 'NOT FOUND'}`);
    console.log('');

    console.log('=== CONSOLE MESSAGES ===\n');
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error' || msg.type === 'request-failed');
    const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');

    if (errorMessages.length > 0) {
      console.log(`Errors (${errorMessages.length}):`);
      errorMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. [${msg.type}] ${msg.text}`);
      });
      console.log('');
    } else {
      console.log('No console errors detected.\n');
    }

    if (warningMessages.length > 0) {
      console.log(`Warnings (${warningMessages.length}):`);
      warningMessages.slice(0, 3).forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.text}`);
      });
      if (warningMessages.length > 3) {
        console.log(`  ... and ${warningMessages.length - 3} more`);
      }
      console.log('');
    }

    if (errors.length > 0) {
      console.log(`Page Errors (${errors.length}):`);
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
      console.log('');
    }

    // Check for specific expected metrics
    const expectedMetrics = [
      'Bitcoin Price',
      'Funding Rate',
      'Fed Net Liquidity',
      'Stablecoin Market Cap',
      'USDT Dominance',
      'RWA TVL'
    ];

    console.log('=== EXPECTED METRICS CHECK ===\n');
    const foundExpected = [];
    const missingExpected = [];

    expectedMetrics.forEach(expected => {
      const found = metricData.metrics.find(m => m.name === expected || m.subtitle.includes(expected));
      if (found) {
        foundExpected.push(expected);
      } else {
        missingExpected.push(expected);
      }
    });

    console.log(`Found: ${foundExpected.length}/${expectedMetrics.length}`);
    foundExpected.forEach(m => console.log(`  ✓ ${m}`));

    if (missingExpected.length > 0) {
      console.log('\nMissing:');
      missingExpected.forEach(m => console.log(`  ✗ ${m}`));
    }

    console.log('\n=== SUMMARY ===\n');
    console.log(`Total Metrics Visible: ${metricData.metrics.length}`);
    console.log(`Expected Metrics Found: ${foundExpected.length}/6`);
    console.log(`Smart Money Radar: ${metricData.hasSmartMoneyRadar ? 'Working' : 'NOT FOUND'} (${metricData.polymarketEventCount} events)`);
    console.log(`Catalyst Calendar: ${metricData.hasCatalystCalendar ? 'Working' : 'NOT FOUND'} (${metricData.calendarEventCount} events)`);
    console.log(`Console Errors: ${errorMessages.length}`);
    console.log(`Page Errors: ${errors.length}`);

    // Overall status
    const allGood = foundExpected.length === 6 &&
                    metricData.hasSmartMoneyRadar &&
                    metricData.hasCatalystCalendar &&
                    errorMessages.length <= 1; // Allow the /docs 404

    console.log(`\nOverall Status: ${allGood ? '✓ PASS' : '✗ ISSUES DETECTED'}`);

  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

detailedCheck().catch(error => {
  console.error('Failed:', error);
  process.exit(1);
});
