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
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(`[${msg.type()}] ${text}`);
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`Page error: ${error.message}`);
  });

  try {
    console.log('Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('Page loaded, waiting for content to render...');

    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get the full HTML to debug
    const fullHTML = await page.evaluate(() => {
      return document.body.innerHTML.substring(0, 50000);
    });

    // Save HTML for inspection
    fs.writeFileSync(
      path.join(__dirname, 'verification', 'page_snapshot.html'),
      fullHTML
    );

    // Extract Smart Money Radar data
    const smartMoneyData = await page.evaluate(() => {
      // Find the Smart Money Radar section
      const headers = Array.from(document.querySelectorAll('h3'));
      const smartMoneyHeader = headers.find(h => h.textContent.includes('Smart Money Radar'));

      if (!smartMoneyHeader) {
        return {
          found: false,
          error: 'Smart Money Radar section not found',
          allH3s: headers.map(h => h.textContent)
        };
      }

      // Get the parent card container
      let container = smartMoneyHeader;
      let depth = 0;
      while (container && depth < 10) {
        if (container.className && (
          container.className.includes('bg-white') ||
          container.className.includes('rounded-lg') ||
          container.className.includes('shadow')
        )) {
          break;
        }
        container = container.parentElement;
        depth++;
      }

      // Get all the content
      const containerHTML = container ? container.innerHTML.substring(0, 5000) : '';

      // Find all event items (they should be in divs with borders)
      const eventDivs = container ? Array.from(container.querySelectorAll('div')).filter(div => {
        const classes = div.className || '';
        return classes.includes('pb-4') && classes.includes('border-b');
      }) : [];

      const events = eventDivs.map(div => {
        // Find the title (should be in an <a> tag)
        const titleLink = div.querySelector('a');
        const title = titleLink ? titleLink.textContent.trim() : '';
        const url = titleLink ? titleLink.getAttribute('href') : '';

        // Find probability - look for percentage text
        const allText = div.textContent;
        const percentMatch = allText.match(/(\d+%|NaN%)/g);

        // Find outcome text (should be before the %)
        const outcomeSpan = Array.from(div.querySelectorAll('span')).find(span => {
          const text = span.textContent;
          return text && (text.includes('Yes') || text.includes('No'));
        });
        const outcome = outcomeSpan ? outcomeSpan.textContent.trim() : '';

        // Find volume
        const volMatch = allText.match(/Vol:\s*\$([0-9.KM]+)/);
        const volume = volMatch ? volMatch[1] : '';

        return {
          title: title.substring(0, 100),
          url,
          outcome,
          probabilities: percentMatch || [],
          probability: percentMatch && percentMatch.length > 0 ? percentMatch[0] : null,
          hasNaN: allText.includes('NaN'),
          volume,
          fullText: allText.substring(0, 200)
        };
      });

      // Alternative: look for any text containing percentages
      const allPercentages = [];
      const walker = document.createTreeWalker(
        container || document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text.match(/\d+%|NaN%/)) {
          allPercentages.push(text);
        }
      }

      return {
        found: true,
        containerHTMLPreview: containerHTML.substring(0, 1000),
        eventDivCount: eventDivs.length,
        events,
        allPercentagesFound: allPercentages,
        eventCount: events.length,
        hasNaN: events.some(e => e.hasNaN),
        allProbabilities: events.map(e => e.probability).filter(p => p !== null)
      };
    });

    console.log('\n=== Smart Money Radar Analysis ===');
    console.log(JSON.stringify(smartMoneyData, null, 2));

    // Scroll to Smart Money Radar
    await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h3'));
      const smartMoneyHeader = headers.find(h => h.textContent.includes('Smart Money Radar'));
      if (smartMoneyHeader) {
        smartMoneyHeader.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take screenshots
    const screenshotPath = path.join(__dirname, 'verification', 'session61_smart_money_radar_fixed.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`\nFull page screenshot saved to: ${screenshotPath}`);

    // Take focused screenshot if section found
    if (smartMoneyData.found) {
      const radarElement = await page.evaluateHandle(() => {
        const headers = Array.from(document.querySelectorAll('h3'));
        const smartMoneyHeader = headers.find(h => h.textContent.includes('Smart Money Radar'));
        if (smartMoneyHeader) {
          let container = smartMoneyHeader;
          let depth = 0;
          while (container && depth < 10) {
            if (container.className && (
              container.className.includes('bg-white') ||
              container.className.includes('rounded-lg')
            )) {
              break;
            }
            container = container.parentElement;
            depth++;
          }
          return container || smartMoneyHeader.parentElement;
        }
        return null;
      });

      if (radarElement) {
        try {
          const boundingBox = await radarElement.asElement().boundingBox();
          if (boundingBox) {
            const focusedPath = path.join(__dirname, 'verification', 'session61_smart_money_radar_focused.png');
            await page.screenshot({
              path: focusedPath,
              clip: {
                x: Math.max(0, boundingBox.x - 10),
                y: Math.max(0, boundingBox.y - 10),
                width: Math.min(boundingBox.width + 20, 1920),
                height: Math.min(boundingBox.height + 20, 1080)
              }
            });
            console.log(`Focused screenshot saved to: ${focusedPath}`);
          }
        } catch (err) {
          console.log('Could not take focused screenshot:', err.message);
        }
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
        eventCount: smartMoneyData.eventCount || 0,
        expectedEventCount: 5,
        hasNaNProbabilities: smartMoneyData.hasNaN || false,
        probabilities: smartMoneyData.allProbabilities || [],
        status: smartMoneyData.found && !smartMoneyData.hasNaN && (smartMoneyData.eventCount || 0) >= 5 ? 'PASS' : 'FAIL',
        issues: []
      }
    };

    // Add specific issues
    if (!smartMoneyData.found) {
      report.verification.issues.push('Smart Money Radar section not found');
    }
    if (smartMoneyData.hasNaN) {
      report.verification.issues.push('NaN probabilities detected - probability field may be missing or undefined');
    }
    if ((smartMoneyData.eventCount || 0) < 5) {
      report.verification.issues.push(`Only ${smartMoneyData.eventCount || 0} events found, expected 5`);
    }
    if ((smartMoneyData.eventCount || 0) === 0 && smartMoneyData.found) {
      report.verification.issues.push('Section found but no events rendered - check if data is loading');
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
      console.log('\n=== Issues Found ===');
      report.verification.issues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
    }

    if (consoleErrors.length > 0 && consoleErrors.length <= 10) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    }

    // Print event details if found
    if (smartMoneyData.events && smartMoneyData.events.length > 0) {
      console.log('\n=== Event Details ===');
      smartMoneyData.events.forEach((event, i) => {
        console.log(`\nEvent ${i + 1}:`);
        console.log(`  Title: ${event.title}`);
        console.log(`  Outcome: ${event.outcome}`);
        console.log(`  Probability: ${event.probability}`);
        console.log(`  Volume: ${event.volume}`);
        console.log(`  Has NaN: ${event.hasNaN}`);
      });
    }

  } catch (error) {
    console.error('\n!!! Error during verification !!!');
    console.error(error);
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
}

verifySmartMoneyRadar().catch(console.error);
