const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const RESULTS_DIR = path.join(ROOT_DIR, 'test-results');

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

const TEST_SUITES = [
  {
    name: 'Infrastructure & Architecture',
    stt: 'STT 01 - 05, 07',
    file: 'tests/infrastructure/infrastructure.test.js'
  },
  {
    name: 'Smoke Health & Gateway',
    stt: 'STT 06, 08',
    file: 'tests/smoke/smoke.test.js'
  },
  {
    name: 'Authentication & Query',
    stt: 'STT 09 - 14',
    file: 'tests/integration/auth-query.test.js'
  },
  {
    name: 'E2E Booking & Ride Lifecycle',
    stt: 'STT 15 - 20',
    file: 'tests/e2e/booking-flow.test.js'
  },
  {
    name: 'Driver Registration & Admin Approval',
    stt: 'STT 21 - 23',
    file: 'tests/integration/driver-admin.test.js'
  },
  {
    name: 'Security & Vulnerability',
    stt: 'STT 24 - 30',
    file: 'tests/security/security.test.js'
  },
  {
    name: 'Trip & Audit Services',
    stt: 'Trip & Audit',
    file: 'tests/integration/trip-audit.test.js'
  }
];

console.log('======================================================================');
console.log('🚀 IUH MSA CAB SYSTEM - AUTOMATED TEST RUNNER (PHIEUCHAM.MD)');
console.log('   Author: Mai Quoc Hung - MSSV: 23732061');
console.log('======================================================================\n');

let totalPassed = 0;
let totalFailed = 0;
const suiteResults = [];

for (const suite of TEST_SUITES) {
  console.log(`▶ Executing: [${suite.stt}] ${suite.name} ...`);
  const startTime = Date.now();
  
  const result = spawnSync('node', ['--test', suite.file], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    env: process.env
  });

  const duration = Date.now() - startTime;
  const isPass = result.status === 0;

  if (isPass) {
    console.log(`  ✅ PASSED (${duration}ms)\n`);
    totalPassed++;
  } else {
    console.error(`  ❌ FAILED (${duration}ms)`);
    console.error(result.stdout || result.stderr);
    totalFailed++;
  }

  suiteResults.push({
    name: suite.name,
    stt: suite.stt,
    file: suite.file,
    passed: isPass,
    durationMs: duration,
    output: result.stdout
  });
}

// Ghi kết quả tóm tắt vào test-results/summary.json
const summaryData = {
  timestamp: new Date().toISOString(),
  candidate: 'Mai Quoc Hung - 23732061',
  totalSuites: TEST_SUITES.length,
  passedSuites: totalPassed,
  failedSuites: totalFailed,
  status: totalFailed === 0 ? 'ALL_PASSED' : 'FAILED',
  suites: suiteResults.map(s => ({
    name: s.name,
    stt: s.stt,
    file: s.file,
    passed: s.passed,
    durationMs: s.durationMs
  }))
};

fs.writeFileSync(
  path.join(RESULTS_DIR, 'summary.json'),
  JSON.stringify(summaryData, null, 2),
  'utf8'
);

console.log('======================================================================');
console.log('📊 TEST EXECUTION SUMMARY:');
console.log(`   Suites Passed: ${totalPassed} / ${TEST_SUITES.length}`);
console.log(`   Suites Failed: ${totalFailed} / ${TEST_SUITES.length}`);
console.log(`   Result Saved:  test-results/summary.json`);
console.log('======================================================================\n');

if (totalFailed > 0) {
  console.error(`❌ Automated tests failed with ${totalFailed} failing suite(s)!`);
  process.exit(1);
} else {
  console.log('🎉 ALL AUTOMATED TEST SUITES PASSED 100% FOR PHIEUCHAM.MD!');
  process.exit(0);
}
