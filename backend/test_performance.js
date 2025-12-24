const start = Date.now();

fetch('http://localhost:3000')
  .then(res => res.text())
  .then(html => {
    const loadTime = Date.now() - start;
    console.log('\n📊 Performance Test Results:');
    console.log(`   Page load time: ${loadTime}ms`);
    console.log(`   HTML size: ${(html.length / 1024).toFixed(2)} KB`);

    if (loadTime < 2000) {
      console.log(`\n✅ Test #36 PASS: Dashboard loads in ${loadTime}ms (< 2 seconds)`);
      process.exit(0);
    } else {
      console.log(`\n❌ Test #36 FAIL: Dashboard loads in ${loadTime}ms (>= 2 seconds)`);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
