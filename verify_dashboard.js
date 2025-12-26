const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1400 });

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));

  // Collect errors
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.toString()));

  try {
    console.log('Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for data to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create verification directory
    const verificationDir = path.join(__dirname, 'verification');
    if (!fs.existsSync(verificationDir)) {
      fs.mkdirSync(verificationDir, { recursive: true });
    }

    // Take full page screenshot
    const screenshotPath = path.join(verificationDir, 'session61_final_dashboard.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Verify dashboard components
    const verification = await page.evaluate(() => {
      const results = {
        column1: {},
        column2: {},
        column3: {},
        issues: []
      };

      const bodyText = document.body.innerText;

      // Column 1 verification
      results.column1.hasUS10Y = bodyText.includes('US 10Y Yield');
      results.column1.hasFedLiq = bodyText.includes('Fed Net Liquidity');
      results.column1.hasSmartMoney = bodyText.includes('Smart Money Radar');
      results.column1.hasNaN = bodyText.includes('NaN%');

      // Count percentages (should be probabilities)
      const percentages = bodyText.match(/\d+\.\d+%/g);
      results.column1.percentageCount = percentages ? percentages.length : 0;

      if (results.column1.hasNaN) {
        results.issues.push('CRITICAL: Found NaN% in Smart Money Radar');
      }

      // Column 2 verification
      results.column2.hasBTC = bodyText.includes('Bitcoin Price');
      results.column2.hasFundingRate = bodyText.includes('Funding Rate') || bodyText.includes('funding');
      results.column2.hasStablecoin = bodyText.includes('Stablecoin Market Cap');
      results.column2.hasUSDT = bodyText.includes('USDT Dominance');
      results.column2.hasETF = bodyText.includes('ETF Flow Tracker');

      // Check for ETF Flow bars (should have multiple bars)
      const etfSection = bodyText.includes('ETF Flow');
      results.column2.etfFlowPresent = etfSection;

      // Column 3 verification
      results.column3.hasRWA = bodyText.includes('RWA TVL');
      results.column3.hasCatalyst = bodyText.includes('Catalyst Calendar');

      // Check for thousands separators
      const hasCommas = bodyText.match(/\d{1,3}(,\d{3})+/g);
      results.formatting = {
        hasThousandsSeparators: hasCommas !== null,
        commaCount: hasCommas ? hasCommas.length : 0
      };

      return results;
    });

    // Print verification results
    console.log('\n=== DASHBOARD VERIFICATION RESULTS ===\n');

    console.log('COLUMN 1 (Macro Indicators):');
    console.log(`  US 10Y Yield: ${verification.column1.hasUS10Y ? '✓' : '✗'}`);
    console.log(`  Fed Net Liquidity: ${verification.column1.hasFedLiq ? '✓' : '✗'}`);
    console.log(`  Smart Money Radar: ${verification.column1.hasSmartMoney ? '✓' : '✗'}`);
    console.log(`  Probabilities (no NaN): ${!verification.column1.hasNaN ? '✓' : '✗ FAILED'}`);
    console.log(`  Percentage values found: ${verification.column1.percentageCount}`);

    console.log('\nCOLUMN 2 (Crypto Metrics):');
    console.log(`  Bitcoin Price: ${verification.column2.hasBTC ? '✓' : '✗'}`);
    console.log(`  Funding Rate: ${verification.column2.hasFundingRate ? '✓' : '✗'}`);
    console.log(`  Stablecoin Market Cap: ${verification.column2.hasStablecoin ? '✓' : '✗'}`);
    console.log(`  USDT Dominance: ${verification.column2.hasUSDT ? '✓' : '✗'}`);
    console.log(`  ETF Flow Tracker: ${verification.column2.hasETF ? '✓' : '✗'}`);

    console.log('\nCOLUMN 3 (Market Intelligence):');
    console.log(`  RWA TVL: ${verification.column3.hasRWA ? '✓' : '✗'}`);
    console.log(`  Catalyst Calendar: ${verification.column3.hasCatalyst ? '✓' : '✗'}`);

    console.log('\nFORMATTING:');
    console.log(`  Thousands separators: ${verification.formatting.hasThousandsSeparators ? '✓' : '✗'}`);
    console.log(`  Formatted numbers found: ${verification.formatting.commaCount}`);

    if (verification.issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      verification.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    if (pageErrors.length > 0) {
      console.log('\n⚠️  PAGE ERRORS:');
      pageErrors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n=== VERIFICATION COMPLETE ===\n');

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
})();
