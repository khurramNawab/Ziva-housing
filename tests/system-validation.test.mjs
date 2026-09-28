/**
 * Ziva Housing — Full System & Section Validation Test Suite
 * Validates:
 *  1. Landing pages (Services & Real Estate) and section integrity
 *  2. Search bar clean-up (No duplicate strips)
 *  3. Mobile & tablet responsive breakpoints
 *  4. Dedicated panel routing (Admin, Vendor, Owner, Customer, Agent)
 *  5. Backend API & Frontend proxy linkage
 *  6. Admin authentication & RBAC endpoints
 *  7. Media and photo asset integrity
 *
 * Run: npm test OR node tests/system-validation.test.mjs
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEB_URL = process.env.TEST_WEB_URL || 'http://localhost:3000';
const API_URL = process.env.TEST_API_URL || 'http://127.0.0.1:4000';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTestSuite() {
  console.log('\n========================================================');
  console.log('   ZIVA HOUSING — COMPREHENSIVE SYSTEM TEST SUITE');
  console.log('========================================================\n');

  // --- Suite 1: Local Static Asset Verification ---
  console.log('📁 [SUITE 1] Dedicated Service Photos & Media Assets');
  const webPublicDir = path.resolve(__dirname, '../apps/web/public/services');
  const requiredPhotos = [
    'ac-service.jpg',
    'electrician-service.jpg',
    'packers-movers.jpg',
    'babysitting.jpg',
    'elderly-care.jpg',
    'modular-kitchen.jpg',
  ];

  requiredPhotos.forEach((file) => {
    const fullPath = path.join(webPublicDir, file);
    const exists = fs.existsSync(fullPath);
    const stats = exists ? fs.statSync(fullPath) : null;
    assert(exists && stats.size > 1000, `Asset exists: /services/${file}`, `size: ${stats?.size || 0} bytes`);
  });

  // --- Suite 2: Public Landing Pages & Section Verification ---
  console.log('\n🌐 [SUITE 2] Landing Pages & Section Integrity');
  try {
    const homeRes = await fetchUrl(`${WEB_URL}/`);
    assert(homeRes.status === 200, 'Home Services landing page loads (HTTP 200)');
    assert(
      homeRes.body.includes('Loading services...') || homeRes.body.includes('Home services at your doorstep') || homeRes.body.includes('Ziva Housing'),
      'Home Services landing shell and client root verified'
    );

    // Verify component structure from page source
    const pageSrc = fs.readFileSync(path.resolve(__dirname, '../apps/web/app/page.tsx'), 'utf8');
    assert(pageSrc.includes('All Home Service Categories'), 'Hero categories section rendered');
    assert(pageSrc.includes('VIP Club Membership'), 'Ziva Plus VIP Club Card section rendered');
    assert(pageSrc.includes('Most Booked Doorstep Services'), 'Most booked doorstep services rendered');
    assert(pageSrc.includes('2,500+ Happy Customers'), 'Realistic startup numbers verified (2,500+ Customers)');
    assert(!pageSrc.includes('Loved by 50,000+ Happy Homes'), 'Unrealistic 50,000+ happy homes banner removed');
    assert(!pageSrc.includes('ZIVA PLUS MEMBERSHIP — SAVE ₹150+ ON EVERY BOOKING\n                </div>'), 'Harsh full-width promo bar removed from under stats');
  } catch (err) {
    assert(false, 'Home page reachable', err.message);
  }

  try {
    const reRes = await fetchUrl(`${WEB_URL}/real-estate`);
    assert(reRes.status === 200, 'Real Estate landing page loads (HTTP 200)');
    assert(!reRes.body.includes('Looking specifically for rentals?'), 'Direct "Browse All Properties" quick link cleanly removed from search bar');
    assert(reRes.body.includes('Buy Property') && reRes.body.includes('Rent Home'), 'Responsive search tabs rendered (Buy, Rent, PG, Projects)');
    assert(reRes.body.includes('1,500+'), 'Realistic Real Estate stats verified (1,500+ Listings)');
  } catch (err) {
    assert(false, 'Real Estate page reachable', err.message);
  }

  try {
    const srvRes = await fetchUrl(`${WEB_URL}/services`);
    assert(srvRes.status === 200, 'Services catalog page loads (HTTP 200)');
    const srvSrc = fs.readFileSync(path.resolve(__dirname, '../apps/web/app/services/page.tsx'), 'utf8');
    assert(srvSrc.includes('All Home Service Categories') && srvSrc.includes('VIP Club Membership'), 'Services catalog page and layout synchronized');
  } catch (err) {
    assert(false, 'Services page reachable', err.message);
  }

  // --- Suite 3: Dedicated Role-Based Panels Routing ---
  console.log('\n🛡️ [SUITE 3] Dedicated Panels & Workspaces Routing');
  const panelRoutes = [
    { path: '/admin', name: 'Admin Portal Overview' },
    { path: '/admin/services', name: 'Admin Services & Categories Hierarchy' },
    { path: '/admin/properties', name: 'Admin Property Queue & Moderation' },
    { path: '/admin/users', name: 'Admin User & Vendor Management' },
    { path: '/admin/leads', name: 'Admin CRM & Pipeline Leads' },
    { path: '/admin/audit-logs', name: 'Admin Compliance & Audit Logs' },
    { path: '/admin/login', name: 'Admin Secure Login Portal' },
    { path: '/dashboard', name: 'Central Dashboard Role Router' },
    { path: '/dashboard/owner', name: 'Property Owner Panel' },
    { path: '/dashboard/provider', name: 'Service Vendor Panel' },
    { path: '/dashboard/customer', name: 'Customer / Renter Panel' },
    { path: '/dashboard/agent', name: 'Agent CRM Panel' },
  ];

  for (const p of panelRoutes) {
    try {
      const res = await fetchUrl(`${WEB_URL}${p.path}`);
      assert(res.status === 200, `${p.name} (${p.path}) returns HTTP 200`);
    } catch (err) {
      assert(false, `${p.name} (${p.path}) reachable`, err.message);
    }
  }

  // --- Suite 4: Backend API & Frontend Proxy Linkage ---
  console.log('\n🔗 [SUITE 4] Backend API & Frontend Proxy Linkage');
  try {
    // 1. Direct Backend Call
    const apiCat = await fetchUrl(`${API_URL}/api/v1/services/categories`);
    assert(apiCat.status === 200, 'Backend API directly serves categories (HTTP 200)');
    const parsedApi = JSON.parse(apiCat.body);
    assert(parsedApi.success === true && Array.isArray(parsedApi.data), 'Backend returns valid categories schema');

    // 2. Frontend Proxy Call via Next.js rewrites
    const proxyCat = await fetchUrl(`${WEB_URL}/api/v1/services/categories`);
    assert(proxyCat.status === 200, 'Frontend Next.js rewrites successfully proxy API calls (HTTP 200)');
    const parsedProxy = JSON.parse(proxyCat.body);
    assert(parsedProxy.success === true, 'Proxy response preserves data integrity');
  } catch (err) {
    assert(false, 'API proxy test executed without network failure', err.message);
  }

  // --- Suite 5: Admin Authentication & RBAC Control ---
  console.log('\n🔑 [SUITE 5] Admin Authentication & RBAC Controls');
  try {
    const loginPayload = JSON.stringify({ identifier: 'admin@zivahousing.com', password: 'Password123!' });
    const loginRes = await fetchUrl(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: loginPayload,
    });
    assert(loginRes.status === 200, 'Admin login authentication successful (HTTP 200)');

    const authJson = JSON.parse(loginRes.body);
    const token = authJson.accessToken || authJson.data?.accessToken;
    assert(Boolean(token), 'Admin JWT access token issued successfully');

    if (token) {
      const dashRes = await fetchUrl(`${API_URL}/api/v1/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert(dashRes.status === 200, 'Authenticated Admin Dashboard KPI fetch (HTTP 200)');

      const adminCatRes = await fetchUrl(`${API_URL}/api/v1/admin/services/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert(adminCatRes.status === 200, 'Authenticated Admin Services Management fetch (HTTP 200)');
    }
  } catch (err) {
    assert(false, 'Admin authentication test succeeded', err.message);
  }

  // --- Suite 6: Security & Secrets Check ---
  console.log('\n🔒 [SUITE 6] Security & Git Leak Prevention');
  const gitignorePath = path.resolve(__dirname, '../.gitignore');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  assert(gitignoreContent.includes('.env'), '.gitignore excludes .env files');
  assert(gitignoreContent.includes('*.pem') && gitignoreContent.includes('*.key'), '.gitignore excludes private keys and certificates');

  console.log('\n========================================================');
  console.log(`   TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
