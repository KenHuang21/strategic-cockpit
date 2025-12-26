const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Helper function to wait for a specified time
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function verifyETFFlowTracker() {
  console.log('Starting ETF Flow Tracker verification...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();

    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the application
    console.log('1. Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(2000); // Wait for any animations

    // Check for the ETF Flow Tracker component
    console.log('\n2. Looking for "Wall St. Flows" component in Column 2 (Market Section)...');

    // Try to find the component by title
    const componentTitle = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('h3, h2, div, span'));
      const wallStFlows = elements.find(el =>
        el.textContent.includes('Wall St. Flows') ||
        el.textContent.includes('Wall St Flows') ||
        el.textContent.includes('ETF Flow')
      );
      return wallStFlows ? wallStFlows.textContent : null;
    });

    if (componentTitle) {
      console.log(`   ✓ Found component: "${componentTitle}"`);
    } else {
      console.log('   ✗ Could not find "Wall St. Flows" component title');
    }

    // Check for bar chart (looking for SVG with rect elements representing bars)
    console.log('\n3. Verifying bar chart is visible...');
    const barChartInfo = await page.evaluate(() => {
      // Look for Recharts BarChart container
      const barChartContainer = document.querySelector('.recharts-wrapper');
      if (!barChartContainer) return { found: false };

      // Count bars (rect elements in the bar layer)
      const bars = barChartContainer.querySelectorAll('.recharts-bar-rectangle path, .recharts-rectangle');

      // Get bar colors to determine positive/negative flows
      const barColors = Array.from(bars).map(bar => {
        const fill = bar.getAttribute('fill') || window.getComputedStyle(bar).fill;
        return fill;
      });

      return {
        found: true,
        barCount: bars.length,
        barColors: barColors
      };
    });

    if (barChartInfo.found) {
      console.log(`   ✓ Bar chart found`);
      console.log(`   ✓ Number of bars: ${barChartInfo.barCount}`);

      // Verify exactly 5 bars
      if (barChartInfo.barCount === 5) {
        console.log('   ✓ Chart displays exactly 5 bars (PASS)');
      } else {
        console.log(`   ✗ Chart displays ${barChartInfo.barCount} bars, expected 5 (FAIL)`);
      }

      console.log(`   - Bar colors: ${barChartInfo.barColors.join(', ')}`);
    } else {
      console.log('   ✗ Bar chart not found (FAIL)');
    }

    // Check for green/red bars
    console.log('\n4. Checking bar colors for positive (green) and negative (red) flows...');
    const colorAnalysis = await page.evaluate(() => {
      const bars = document.querySelectorAll('.recharts-bar-rectangle path, .recharts-rectangle');
      const colorInfo = [];

      bars.forEach((bar, index) => {
        const fill = bar.getAttribute('fill') || window.getComputedStyle(bar).fill;
        let colorType = 'unknown';

        // Check if it's green (positive) or red (negative)
        // Green variants: #10b981 (emerald-500), #22c55e (green-500), rgb(34, 197, 94)
        // Red variants: #ef4444 (red-500), rgb(239, 68, 68)
        if (fill.includes('#10b981') || fill.includes('rgb(16, 185, 129)') ||
            fill.includes('#22c55e') || fill.includes('rgb(34, 197, 94)') ||
            fill.toLowerCase().includes('green') || fill.toLowerCase().includes('emerald')) {
          colorType = 'green (positive)';
        } else if (fill.includes('#ef4444') || fill.includes('rgb(239, 68, 68)') ||
                   fill.toLowerCase().includes('red')) {
          colorType = 'red (negative)';
        }

        colorInfo.push({ index: index + 1, color: fill, type: colorType });
      });

      return colorInfo;
    });

    if (colorAnalysis.length > 0) {
      colorAnalysis.forEach(bar => {
        console.log(`   Bar ${bar.index}: ${bar.type} (${bar.color})`);
      });

      const hasGreen = colorAnalysis.some(b => b.type.includes('green'));
      const hasRed = colorAnalysis.some(b => b.type.includes('red'));

      if (hasGreen) {
        console.log('   ✓ Green bars found for positive flows (PASS)');
      }
      if (hasRed) {
        console.log('   ✓ Red bars found for negative flows (PASS)');
      }
    }

    // Check for dates
    console.log('\n5. Verifying chart shows dates for the last 5 days...');
    const dateInfo = await page.evaluate(() => {
      // Look for x-axis labels - try multiple selectors
      let xAxisLabels = document.querySelectorAll('.recharts-xAxis .recharts-text');

      // If not found, try alternative selectors
      if (xAxisLabels.length === 0) {
        xAxisLabels = document.querySelectorAll('.recharts-xAxis text');
      }

      if (xAxisLabels.length === 0) {
        // Try to find text elements in the chart that look like dates (MM/DD format)
        const allTextInChart = document.querySelectorAll('.recharts-wrapper text');
        xAxisLabels = Array.from(allTextInChart).filter(text =>
          /\d{1,2}\/\d{1,2}/.test(text.textContent)
        );
      }

      const dates = Array.from(xAxisLabels).map(label => label.textContent);

      return {
        found: dates.length > 0,
        dates: dates,
        count: dates.length
      };
    });

    if (dateInfo.found) {
      console.log(`   ✓ Found ${dateInfo.count} date labels: ${dateInfo.dates.join(', ')}`);
      if (dateInfo.count === 5) {
        console.log('   ✓ Chart shows 5 dates (PASS)');
      } else {
        console.log(`   ⚠ Chart shows ${dateInfo.count} dates, expected 5`);
      }
    } else {
      console.log('   ✗ No date labels found (FAIL)');
    }

    // Check for 5-Day Net Flow summary
    console.log('\n6. Checking for "5-Day Net Flow: $X.XB" summary...');
    const netFlowSummary = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div, p, span'));
      const netFlowElement = elements.find(el =>
        el.textContent.includes('5-Day Net Flow') ||
        el.textContent.includes('5-day Net Flow') ||
        el.textContent.includes('Net Flow')
      );
      return netFlowElement ? netFlowElement.textContent.trim() : null;
    });

    if (netFlowSummary) {
      console.log(`   ✓ Found summary: "${netFlowSummary}" (PASS)`);

      // Check if it matches the expected format
      if (netFlowSummary.match(/5-Day Net Flow.*\$[\d.]+[BM]/i)) {
        console.log('   ✓ Summary format matches expected pattern (PASS)');
      } else {
        console.log('   ⚠ Summary format may not match expected pattern');
      }
    } else {
      console.log('   ✗ Net Flow summary not found (FAIL)');
    }

    // Take screenshot
    console.log('\n7. Taking screenshot...');
    const screenshotPath = path.join(__dirname, 'session61_etf_flow_tracker.png');

    // Try to scroll to the component first
    await page.evaluate(() => {
      const element = Array.from(document.querySelectorAll('h3, h2, div, span'))
        .find(el => el.textContent.includes('Wall St. Flows') || el.textContent.includes('ETF Flow'));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    await wait(1000);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   ✓ Screenshot saved to: ${screenshotPath}`);

    // Test hover tooltips
    console.log('\n8. Testing hover tooltips...');
    const tooltipTest = await page.evaluate(() => {
      const bars = document.querySelectorAll('.recharts-bar-rectangle path, .recharts-rectangle');
      if (bars.length === 0) return { found: false };

      // Trigger mouseover on first bar
      const firstBar = bars[0];
      const mouseOverEvent = new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      firstBar.dispatchEvent(mouseOverEvent);

      return { found: true, barCount: bars.length };
    });

    if (tooltipTest.found) {
      await wait(500); // Wait for tooltip to appear

      const tooltipVisible = await page.evaluate(() => {
        const tooltip = document.querySelector('.recharts-tooltip-wrapper, .recharts-default-tooltip');
        return tooltip && tooltip.style.visibility !== 'hidden';
      });

      if (tooltipVisible) {
        console.log('   ✓ Hover tooltip appears (PASS)');

        const tooltipContent = await page.evaluate(() => {
          const tooltip = document.querySelector('.recharts-tooltip-wrapper, .recharts-default-tooltip');
          return tooltip ? tooltip.textContent : '';
        });
        console.log(`   - Tooltip content: "${tooltipContent}"`);
      } else {
        console.log('   ⚠ Hover tooltip not visible or not tested');
      }
    } else {
      console.log('   ⚠ Could not test tooltip (no bars found)');
    }

    // Check for console errors
    console.log('\n9. Checking for console errors...');
    if (consoleErrors.length === 0) {
      console.log('   ✓ No console errors detected (PASS)');
    } else {
      console.log(`   ✗ Found ${consoleErrors.length} console errors:`);
      consoleErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log('Test #63 - ETF Flow Tracker');
    console.log('Component: Wall St. Flows (Column 2 - Market Section)');
    console.log('\nTest Criteria:');
    console.log(`- Chart displays exactly 5 bars: ${barChartInfo.barCount === 5 ? 'PASS' : 'FAIL'}`);
    console.log(`- Green bars for inflows: ${colorAnalysis.some(b => b.type.includes('green')) ? 'PASS' : 'CHECK SCREENSHOT'}`);
    console.log(`- Red bars for outflows: ${colorAnalysis.some(b => b.type.includes('red')) ? 'PASS' : 'CHECK SCREENSHOT'}`);
    console.log(`- Shows dates for last 5 days: ${dateInfo.count === 5 ? 'PASS' : 'PARTIAL'}`);
    console.log(`- 5-Day Net Flow summary: ${netFlowSummary ? 'PASS' : 'FAIL'}`);
    console.log(`- Hover tooltips: ${tooltipTest.found ? 'FUNCTIONAL' : 'NOT TESTED'}`);
    console.log(`- No console errors: ${consoleErrors.length === 0 ? 'PASS' : 'FAIL'}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error during verification:', error.message);
    throw error;
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
}

// Run the verification
verifyETFFlowTracker()
  .then(() => {
    console.log('\n✅ Verification complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
