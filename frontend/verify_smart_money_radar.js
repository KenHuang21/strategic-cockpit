const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function verifySmartMoneyRadar() {
  console.log('Starting browser automation...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Track console messages and errors
  const consoleMessages = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`Page error: ${error.message}`);
  });

  try {
    console.log('Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Page loaded, waiting for Smart Money Radar section...');

    // Wait for the Smart Money Radar section to be visible
    await page.waitForSelector('h3', { timeout: 10000 }).catch(() => {
      console.log('Could not find h3 elements...');
    });

    // Wait a bit more for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract Smart Money Radar data
    const smartMoneyData = await page.evaluate(() => {
      // Find the Smart Money Radar section
      const headers = Array.from(document.querySelectorAll('h3'));
      const smartMoneyHeader = headers.find(h => h.textContent.includes('Smart Money Radar'));

      if (!smartMoneyHeader) {
        return { found: false, error: 'Smart Money Radar section not found' };
      }

      // Get the parent container
      const container = smartMoneyHeader.closest('div[class*="card"]') || smartMoneyHeader.parentElement;

      // Find all probability elements (looking for percentage text)
      const events = [];
      const percentageElements = Array.from(container.querySelectorAll('*')).filter(el => {
        const text = el.textContent;
        return text && text.includes('%') && !el.querySelector('*');
      });

      percentageElements.forEach(el => {
        const text = el.textContent.trim();
        const percentMatch = text.match(/(\d+%|NaN%)/);
        if (percentMatch) {
          // Try to find associated event text
          let eventText = '';
          let current = el;
          while (current && !eventText) {
            const parent = current.parentElement;
            if (parent) {
              const textNodes = Array.from(parent.childNodes).filter(n => n.nodeType === 3);
              eventText = textNodes.map(n => n.textContent.trim()).join(' ');
              if (!eventText || eventText === percentMatch[0]) {
                current = parent;
                eventText = '';
              } else {
                break;
              }
            } else {
              break;
            }
          }

          events.push({
            probability: percentMatch[0],
            hasNaN: percentMatch[0].includes('NaN'),
            context: text
          });
        }
      });

      return {
        found: true,
        eventCount: events.length,
        events,
        hasNaN: events.some(e => e.hasNaN),
        allProbabilities: events.map(e => e.probability)
      };
    });

    console.log('\n=== Smart Money Radar Analysis ===');
    console.log(JSON.stringify(smartMoneyData, null, 2));

    // Find the Smart Money Radar section and scroll to it
    const radarSection = await page.evaluateHandle(() => {
      const headers = Array.from(document.querySelectorAll('h3'));
      const smartMoneyHeader = headers.find(h => h.textContent.includes('Smart Money Radar'));
      return smartMoneyHeader ? smartMoneyHeader.closest('div[class*="card"]') || smartMoneyHeader.parentElement : null;
    });

    if (radarSection) {
      await radarSection.asElement().scrollIntoView();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Take screenshot
    const screenshotPath = path.join(__dirname, 'verification', 'session61_smart_money_radar_fixed.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`\nScreenshot saved to: ${screenshotPath}`);

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:3001',
      smartMoneyRadar: smartMoneyData,
      consoleErrors: consoleErrors,
      verification: {
        sectionFound: smartMoneyData.found,
        eventCount: smartMoneyData.eventCount,
        expectedEventCount: 5,
        hasNaNProbabilities: smartMoneyData.hasNaN,
        probabilities: smartMoneyData.allProbabilities,
        status: smartMoneyData.found && !smartMoneyData.hasNaN && smartMoneyData.eventCount >= 5 ? 'PASS' : 'FAIL'
      }
    };

    console.log('\n=== Verification Report ===');
    console.log(JSON.stringify(report, null, 2));

    // Save report
    const reportPath = path.join(__dirname, 'verification', 'session61_verification_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);

    // Print summary
    console.log('\n=== SUMMARY ===');
    console.log(`Status: ${report.verification.status}`);
    console.log(`Smart Money Radar Found: ${report.verification.sectionFound ? 'YES' : 'NO'}`);
    console.log(`Events Detected: ${report.verification.eventCount}/${report.verification.expectedEventCount}`);
    console.log(`Has NaN Probabilities: ${report.verification.hasNaNProbabilities ? 'YES (ISSUE)' : 'NO (GOOD)'}`);
    console.log(`Probabilities: ${report.verification.probabilities.join(', ')}`);
    console.log(`Console Errors: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    }

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
}

verifySmartMoneyRadar().catch(console.error);
