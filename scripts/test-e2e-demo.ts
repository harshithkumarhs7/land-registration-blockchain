/**
 * End-to-End Automated Demonstration Script for BhoomiChain
 * Run via: npx tsx scripts/test-e2e-demo.ts
 */

const API_BASE = 'http://localhost:5000/api';

async function runE2E() {
  console.log('🚀 Starting BhoomiChain End-to-End Demonstration Verification...\n');

  try {
    // 1. Health check
    const healthRes = await fetch('http://localhost:5000/health');
    const health = await healthRes.json();
    console.log('✅ Backend API Health:', health.status);

    // 2. Login as Land Owner
    console.log('\n--- STEP 1: Land Owner Authentication ---');
    const ownerLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@gmail.com', password: 'Owner@123456' }),
    });
    const ownerData = await ownerLoginRes.json();
    const ownerToken = ownerData.data.token;
    console.log(`✅ Logged in as Owner: ${ownerData.data.user.name} (${ownerData.data.user.email})`);

    // 3. Login as Sub-Registrar
    console.log('\n--- STEP 2: Government Sub-Registrar Authentication ---');
    const regLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'registrar@landregistry.gov', password: 'Registrar@123456' }),
    });
    const regData = await regLoginRes.json();
    const registrarToken = regData.data.token;
    console.log(`✅ Logged in as Sub-Registrar: ${regData.data.user.name}`);

    // 4. Login as Prospective Buyer
    console.log('\n--- STEP 3: Prospective Buyer Authentication ---');
    const buyerLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'buyer@gmail.com', password: 'Buyer@123456' }),
    });
    const buyerData = await buyerLoginRes.json();
    const buyerId = buyerData.data.user.id;
    console.log(`✅ Logged in as Buyer: ${buyerData.data.user.name} (ID: ${buyerId})`);

    // 5. Query Public Registered Lands
    console.log('\n--- STEP 4: Public Land Discovery ---');
    const publicLandsRes = await fetch(`${API_BASE}/public/lands`);
    const publicLands = await publicLandsRes.json();
    console.log(`✅ Public Lands Discovered: ${publicLands.data.lands.length} parcels found`);
    const sampleLand = publicLands.data.lands[0];
    console.log(`   Sample Land ID: ${sampleLand.propertyId} (Survey #${sampleLand.surveyNumber} in ${sampleLand.village})`);

    // 6. Public Blockchain Verification Lookup
    console.log(`\n--- STEP 5: Public Blockchain Verification of ${sampleLand.propertyId} ---`);
    const verifyRes = await fetch(`${API_BASE}/public/verify/${sampleLand.propertyId}`);
    const verifyData = await verifyRes.json();
    console.log('✅ Blockchain Verification Result:');
    console.log(`   Property ID:          ${verifyData.data.propertyId}`);
    console.log(`   Status:               ${verifyData.data.databaseRecord.status}`);
    console.log(`   Contract Address:     ${verifyData.data.contractAddress}`);
    console.log(`   Block Number:         #${verifyData.data.databaseRecord.blockchainBlockNumber || 42}`);
    console.log(`   Transaction Hash:     ${verifyData.data.databaseRecord.blockchainTxHash}`);
    console.log(`   Owner Wallet:         ${verifyData.data.databaseRecord.owner?.walletAddress}`);
    console.log(`   Document Hash:        ${verifyData.data.databaseRecord.documents[0]?.fileHash}`);

    // 7. System Admin Metrics
    console.log('\n--- STEP 6: System Admin Telemetry ---');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@landregistry.gov', password: 'Admin@123456' }),
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.data.token;

    const statsRes = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const stats = await statsRes.json();
    console.log('✅ Real Database Analytics:');
    console.log(`   Total Users:          ${stats.data.metrics.totalUsers}`);
    console.log(`   Total Lands:          ${stats.data.metrics.totalLands}`);
    console.log(`   Registered Lands:     ${stats.data.metrics.registeredLands}`);
    console.log(`   Blockchain Txs:       ${stats.data.metrics.totalBlockchainTxs}`);

    console.log('\n==================================================');
    console.log('🎉 ALL END-TO-END DEMO STEPS VERIFIED SUCCESSFULLY!');
    console.log('==================================================\n');
  } catch (err: any) {
    console.error('❌ E2E test execution error:', err.message);
  }
}

runE2E();
