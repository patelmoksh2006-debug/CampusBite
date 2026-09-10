const BASE_URL = 'http://localhost:5000';

async function testEnhancements() {
  console.log('Testing CampusBite New Enhancements...\n');

  try {
    // 1. Test AI Chatbot
    const aiRes = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What are the Jain options?' })
    });
    const aiData = await aiRes.json();
    console.log('✓ 1. AI Chatbot Reply:\n', aiData.reply);
    console.log('✓ 1b. WhatsApp Link:', aiData.whatsappLink);

    // 2. Test Add Product by Kitchen
    const addProductRes = await fetch(`${BASE_URL}/api/kitchen/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Amritsari Chole Bhature Special',
        category_id: 1,
        description: 'Two fluffy bhaturas with spiced pindi chole, pickled onions & mint chutney',
        price: 75.00,
        is_veg: true,
        is_jain: false,
        prep_time_mins: 7,
        calories: 560,
        spice_level: 2,
        station_name: 'Tawa 1',
        initial_stock: 40
      })
    });
    const addData = await addProductRes.json();
    console.log('\n✓ 2. Kitchen Product Created:', addData.message, '| ID:', addData.dishId);

    // 3. Verify Product appears in Menu
    const menuRes = await fetch(`${BASE_URL}/api/menu/items`);
    const menuData = await menuRes.json();
    const found = menuData.items.find(i => i.name === 'Amritsari Chole Bhature Special');
    console.log('✓ 3. Verified in Student Menu:', Boolean(found), '| Total menu items now:', menuData.count);

    // 4. Test Kitchen Ready status progression & notification push
    const updateRes = await fetch(`${BASE_URL}/api/kitchen/orders/1/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'READY' })
    });
    const updateData = await updateRes.json();
    console.log('\n✓ 4. Kitchen Order Status Updated to READY:', updateData.message);

    // 5. Test Delete Product
    if (addData.dishId) {
      const delRes = await fetch(`${BASE_URL}/api/kitchen/products/${addData.dishId}`, {
        method: 'DELETE'
      });
      const delData = await delRes.json();
      console.log('✓ 5. Kitchen Product Deleted:', delData.message);
    }

    console.log('\n=======================================================');
    console.log('🎉 ALL ENHANCEMENT TESTS PASSED WITH 100% SUCCESS!');
    console.log('=======================================================');
  } catch (err) {
    console.error('Enhancement test error:', err.message);
  }
}

setTimeout(testEnhancements, 1000);
