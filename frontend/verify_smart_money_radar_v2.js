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

    // Wait for the page to render
    await page.waitForSelector('h3', { timeout: 10000 }).catch(() => {
      console.log('Could not find h3 elements...');
    });

    // Wait a bit more for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract Smart Money Radar data with improved detection
    const smartMoneyData = await page.evaluate(() => {
      // Find the Smart Money Radar section
      const headers = Array.from(document.querySelectorAll('h3'));
      const smartMoneyHeader = headers.find(h => h.textContent.includes('Smart Money Radar'));

      if (!smartMoneyHeader) {
        return { found: false, error: 'Smart Money Radar section not found' };
      }

      // Get the parent container (card)
      let container = smartMoneyHeader;
      while (container && !container.className.includes('card')) {
        container = container.parentElement;
      }

      if (!container) {
        container = smartMoneyHeader.parentElement;
      }

      // Get all text content
      const allText = container.textContent;

      // Find all elements that might contain probabilities
      const events = [];

      // Method 1: Find all text nodes with percentage
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text && text.length > 0) {
          textNodes.push(text);
        }
      }

      // Look for percentage patterns
      const percentRegex = /(\d+%|NaN%)/g;
      const foundPercentages = [];

      textNodes.forEach(text => {
        const matches = text.match(percentRegex);
        if (matches) {
          matches.forEach(match => {
            foundPercentages.push({
              probability: match,
              hasNaN: match.includes('NaN'),
              context: text.substring(0, 100)
            });
          });
        }
      });

      // Method 2: Look for specific class patterns or data attributes
      const probabilityElements = Array.from(container.querySelectorAll('*')).filter(el => {
        const text = el.textContent;
        return text && (text.includes('%') || text.match(/\d+%/));
      });

      const elementsWithPercent = probabilityElements.map(el => ({
        tag: el.tagName,
        class: el.className,
        text: el.textContent.trim().substring(0, 100),
        hasNaN: el.textContent.includes('NaN')
      }));

      // Get the most specific elements (leaf nodes with %)
      const leafPercentages = probabilityElements
        .filter(el => {
          const children = Array.from(el.children);
          return children.length === 0 || !children.some(child => child.textContent.includes('%'));
        })
        .map(el => {
          const text = el.textContent.trim();
          const percentMatch = text.match(/(\d+%|NaN%)/);
          return {
            probability: percentMatch ? percentMatch[0] : text,
            hasNaN: text.includes('NaN'),
            fullText: text,
            element: {
              tag: el.tagName,
              class: el.className
            }
          };
        });

      return {
        found: true,
        containerText: allText.substring(0, 500),
        textNodesWithPercent: foundPercentages,
        elementsWithPercent: elementsWithPercent.slice(0, 10),
        leafPercentages: leafPercentages,
        eventCount: leafPercentages.length,
        events: leafPercentages,
        hasNaN: leafPercentages.some(e => e.hasNaN),
        allProbabilities: leafPercentages.map(e => e.probability)
      };
    });

    console.log('\n=== Smart Money Radar Analysis ===');
    console.log(JSON.stringify(smartMoneyData, null, 2));

    // Find the Smart Money Radar section and scroll to it
    await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h3'));
      const smartMoneyHeader = headers.find(h => h.textContent.includes('Smart Money Radar'));
      if (smartMoneyHeader) {
        let container = smartMoneyHeader;
        while (container && !container.className.includes('card')) {
          container = container.parentElement;
        }
        if (container) {
          container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take full page screenshot
    const screenshotPath = path.join(__dirname, 'verification', 'session61_smart_money_radar_fixed.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`\nScreenshot saved to: ${screenshotPath}`);

    // Also take a focused screenshot of just the Smart Money Radar section
    const radarElement = await page.evaluateHandle(() => {
      const headers = Array.from(document.querySelectorAll('h3'));
      const smartMoneyHeader = headers.find(h => h.textContent.includes('Smart Money Radar'));
      if (smartMoneyHeader) {
        let container = smartMoneyHeader;
        while (container && !container.className.includes('card')) {
          container = container.parentElement;
        }
        return container || smartMoneyHeader.parentElement;
      }
      return null;
    });

    if (radarElement) {
      const boundingBox = await radarElement.asElement().boundingBox();
      if (boundingBox) {
        const focusedScreenshotPath = path.join(__dirname, 'verification', 'session61_smart_money_radar_focused.png');
        await page.screenshot({
          path: focusedScreenshotPath,
          clip: {
            x: boundingBox.x,
            y: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height
          }
        });
        console.log(`Focused screenshot saved to: ${focusedScreenshotPath}`);
      }
    }

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
        status: smartMoneyData.found && !smartMoneyData.hasNaN && smartMoneyData.eventCount >= 5 ? 'PASS' : 'FAIL',
        issues: []
      }
    };

    // Add specific issues
    if (!smartMoneyData.found) {
      report.verification.issues.push('Smart Money Radar section not found');
    }
    if (smartMoneyData.hasNaN) {
      report.verification.issues.push('NaN probabilities detected');
    }
    if (smartMoneyData.eventCount < 5) {
      report.verification.issues.push(`Only ${smartMoneyData.eventCount} events found, expected 5`);
    }

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

    if (report.verification.issues.length > 0) {
      console.log('\n=== Issues ===');
      report.verification.issues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
    }

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
