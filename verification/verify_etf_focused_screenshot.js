const puppeteer = require('puppeteer');
const path = require('path');

// Helper function to wait for a specified time
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function captureETFComponent() {
  console.log('Capturing focused screenshot of ETF Flow Tracker...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();

    console.log('Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(2000);

    // Find and screenshot just the ETF Flow component
    console.log('Finding Wall St. Flows component...');

    const componentBounds = await page.evaluate(() => {
      // Find the component by its title
      const headings = Array.from(document.querySelectorAll('h3'));
      const wallStFlowsHeading = headings.find(h => h.textContent.includes('Wall St. Flows'));

      if (!wallStFlowsHeading) {
        return null;
      }

      // Get the parent card container
      let container = wallStFlowsHeading.closest('div.bg-white, div.shadow-md, div.rounded-lg');

      // Scroll into view
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = container.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        };
      }

      return null;
    });

    await wait(1000);

    if (componentBounds) {
      console.log('Component found, capturing screenshot...');
      const screenshotPath = path.join(__dirname, 'session61_etf_flow_focused.png');

      await page.screenshot({
        path: screenshotPath,
        clip: {
          x: componentBounds.x,
          y: componentBounds.y,
          width: componentBounds.width,
          height: componentBounds.height
        }
      });

      console.log(`✓ Focused screenshot saved to: ${screenshotPath}`);
    } else {
      console.log('✗ Could not find component for focused screenshot');
      // Take full page screenshot as fallback
      const screenshotPath = path.join(__dirname, 'session61_etf_flow_focused.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✓ Full page screenshot saved to: ${screenshotPath}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

captureETFComponent()
  .then(() => console.log('\n✅ Screenshot capture complete!'))
  .catch(error => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
