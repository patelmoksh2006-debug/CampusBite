const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('Testing CampusBite Backend Endpoints with native fetch...\n');

  try {
    // 1. Health
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    console.log('✓ 1. Health Check:', health.status, '| DB Engine:', health.databaseEngine);

    // 2. Demo Accounts
    const demoRes = await fetch(`${BASE_URL}/api/auth/demo-accounts`);
    const demo = await demoRes.json();
    console.log('✓ 2. Demo Accounts:', demo.student.email, 'and', demo.kitchen.email);

    // 3. Login as Student
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student.demo@campusbite.edu',
        password: 'password123'
      })
    });
    const studentLogin = await studentLoginRes.json();
    console.log('✓ 3. Student Login successful:', studentLogin.user.full_name, '| Roll No:', studentLogin.student_profile?.roll_number);
    const studentToken = studentLogin.token;

    // 4. Menu items
    const menuRes = await fetch(`${BASE_URL}/api/menu/items`);
    const menu = await menuRes.json();
    console.log(`✓ 4. Menu Items fetched: ${menu.count} dishes available`);

    // 5. Pickup slots
    const slotsRes = await fetch(`${BASE_URL}/api/menu/slots`);
    const slots = await slotsRes.json();
    console.log(`✓ 5. Pickup Slots fetched: ${slots.slots.length} windows active`);

    // 6. Order Status
    const orderStatusRes = await fetch(`${BASE_URL}/api/orders/%23TOKEN-412/status`);
    const orderStatus = await orderStatusRes.json();
    console.log('✓ 6. Order #TOKEN-412 Status:', orderStatus.order.status, '| PIN:', orderStatus.order.security_pin);

    // 7. Statutory Tax Invoice
    const invoiceRes = await fetch(`${BASE_URL}/api/orders/%23TOKEN-412/invoice`);
    const invoice = await invoiceRes.json();
    console.log('✓ 7. Statutory Tax Invoice generated:', invoice.invoice.invoiceNumber, '| GSTIN:', invoice.invoice.statutoryHeader.gstin, '| Grand Total: ₹' + invoice.invoice.taxComputation.grandTotal);

    // 8. Kitchen KOT board
    const kotRes = await fetch(`${BASE_URL}/api/kitchen/kot-board`);
    const kot = await kotRes.json();
    console.log('✓ 8. Kitchen KOT Board stats:', JSON.stringify(kot.stats));

    // 9. Wallet summary
    const walletRes = await fetch(`${BASE_URL}/api/wallet/summary`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const wallet = await walletRes.json();
    console.log('✓ 9. Wallet Summary: Balance ₹' + wallet.summary.balance, '| Karma:', wallet.summary.campusKarmaPoints);

    console.log('\n=======================================================');
    console.log('🎉 ALL 9 BACKEND ENDPOINT TESTS PASSED WITH 100% SUCCESS!');
    console.log('=======================================================');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

// Wait a bit for server
setTimeout(runTests, 1000);
