import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const files = {
  gitignore: read(".gitignore"),
  upload: read("app/api/upload/route.ts"),
  storage: read("lib/storage.ts"),
  storageSql: read("database/SETUP_SUPABASE.sql"),
  security: read("lib/serverSecurity.ts"),
  superAdmin: read("components/SuperAdminApp.tsx"),
  referral: read("app/api/referral/route.ts"),
  adminUsers: read("app/api/admin/users/route.ts"),
  cleanup: read("app/api/admin/cleanup/route.ts"),
  importProduct: read("app/api/admin/import-product/route.ts"),
  fixCategories: read("app/api/admin/fix-categories/route.ts"),
  migrateImages: read("app/api/admin/migrate-images/route.ts"),
  paytech: read("app/api/paytech/route.ts"),
  cinetpay: read("app/api/cinetpay/route.ts"),
  wave: read("app/api/wave/route.ts"),
  chariow: read("app/api/chariow/route.ts"),
  paytechIpn: read("app/api/paytech/ipn/route.ts"),
  cinetpayNotify: read("app/api/cinetpay/notify/route.ts"),
  waveWebhook: read("app/api/wave/webhook/route.ts"),
  chariowWebhook: read("app/api/chariow/webhook/route.ts"),
  paytechTest: read("app/api/paytech-test/route.ts"),
  campaign: read("lib/campaign.ts"),
  campaignPublish: read("app/api/campaign/publish-listing/route.ts"),
  campaignAutoPublish: read("app/api/campaign/auto-publish/route.ts"),
  otp: read("app/api/otp/route.ts"),
};

assert.match(files.gitignore, /^\.env\.production$/m, "production env files must be ignored");
assert.match(files.gitignore, /^\.env\.development$/m, "development env files must be ignored");
assert.match(files.gitignore, /^\.env\.test$/m, "test env files must be ignored");

assert.match(files.upload, /authClient\.auth\.getUser\(\)/, "upload must require a logged-in user");
assert.match(files.upload, /ALLOWED_FOLDERS/, "upload must restrict destination folders");
assert.match(files.upload, /MAX_IMAGE_BYTES/, "upload must enforce an image size limit");
assert.match(files.upload, /hasValidImageSignature/, "upload must validate image magic bytes");
for (const mime of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
  assert.ok(files.upload.includes(`"${mime}"`), `upload must allow ${mime} explicitly`);
}

assert.match(files.storage, /auth\.getUser\(\)/, "browser storage fallback must require a logged-in user");
assert.match(files.storage, /ALLOWED_FOLDERS/, "browser storage fallback must restrict folders");
assert.match(files.storageSql, /'chat_media', 'chat_media', false/, "chat media bucket must be private");
assert.match(files.storageSql, /split_part\(name, '\/', 1\) = auth\.uid\(\)::text/, "chat media writes must be user-prefixed");
assert.match(files.storageSql, /bucket_id = 'images'/, "public storage read must be limited to images");

assert.match(files.security, /timingSafeEqual/, "admin auth must use timing-safe comparison");
assert.match(files.security, /createAdminSessionToken/, "admin auth must issue signed sessions");
assert.match(files.security, /ADMIN_SESSION_COOKIE/, "admin sessions must use a named cookie");
assert.match(files.security, /getAdminSessionTokenFromRequest/, "admin auth must read sessions from cookies");
assert.match(files.security, /ADMIN_2FA_SECRET/, "admin auth must support TOTP 2FA");
assert.match(files.security, /verifyTotp/, "admin auth must verify TOTP codes");

assert.doesNotMatch(files.superAdmin, /code !== "1234"|code === "1234"|placeholder="Code 2FA \(1234\)"/, "super admin UI must not accept demo 2FA code 1234");
assert.doesNotMatch(files.superAdmin, /sa_admin_token|sessionStorage/, "super admin UI must not store admin sessions in web storage");
assert.match(files.adminUsers, /cookies\.set\(ADMIN_SESSION_COOKIE/, "admin login must set an httpOnly cookie");
assert.match(files.adminUsers, /httpOnly: true/, "admin cookie must be httpOnly");
assert.doesNotMatch(files.adminUsers, /adminToken/, "admin API must not return or accept adminToken JSON");

assert.match(files.referral, /authClient\.auth\.getUser\(\)/, "referral API must require a logged-in user");
assert.match(files.referral, /user\.id !== userId/, "referral API must bind requests to the logged-in user");
assert.match(files.referral, /\.is\("referred_by", null\)/, "referral API must credit only once");

for (const [name, source] of Object.entries({
  adminUsers: files.adminUsers,
  cleanup: files.cleanup,
  importProduct: files.importProduct,
  fixCategories: files.fixCategories,
  migrateImages: files.migrateImages,
})) {
  assert.match(source, /verifyAdminPassword/, `${name} must use shared admin auth`);
  assert.doesNotMatch(source, /sessionToken:\s*.*adminToken/, `${name} must not accept adminToken JSON sessions`);
}

for (const [name, source] of Object.entries({
  paytech: files.paytech,
  cinetpay: files.cinetpay,
  wave: files.wave,
  chariow: files.chariow,
})) {
  assert.match(source, /resolveCheckoutIntent/, `${name} checkout must resolve price server-side`);
  assert.doesNotMatch(source, /const \{[^}]*amount[^}]*\} = body/, `${name} checkout must not trust client amount`);
}

for (const [name, source] of Object.entries({
  paytechIpn: files.paytechIpn,
  cinetpayNotify: files.cinetpayNotify,
  waveWebhook: files.waveWebhook,
  chariowWebhook: files.chariowWebhook,
})) {
  assert.match(source, /assertProviderAmount/, `${name} must validate paid amount against expected amount`);
  assert.match(source, /ensureListingOwnedByUser/, `${name} must verify listing ownership before activation`);
}
assert.match(files.paytechIpn, /purchaseAlreadyExists/, "PayTech IPN must be idempotent");
assert.match(files.cinetpayNotify, /purchaseAlreadyExists/, "CinetPay notify must be idempotent");
assert.match(files.waveWebhook, /purchaseAlreadyExists/, "Wave webhook must be idempotent");
assert.match(files.waveWebhook, /!WEBHOOK_SECRET && process\.env\.NODE_ENV === "production"/, "Wave webhook secret must be required in production");
assert.match(files.chariowWebhook, /process\.env\.NODE_ENV !== "production"/, "Chariow webhook token must fail closed in production");

assert.doesNotMatch(files.paytechTest, /keySnippet|secretSnippet|request-payment/, "PayTech diagnostic route must not expose secrets or call provider publicly");
assert.match(files.paytechTest, /status:\s*410/, "PayTech diagnostic route must be disabled");
assert.match(files.campaignPublish, /checkCampaignSecret\(req\)/, "publish-listing must require campaign secret");
assert.match(files.campaign, /NODE_ENV !== "production"/, "campaign secret checks must fail closed in production");
assert.match(files.campaignAutoPublish, /NODE_ENV !== "production"/, "auto-publish must fail closed when no secret is configured in production");

assert.match(files.otp, /OTP_DEMO_ENABLED === "true"/, "OTP demo mode must be explicit opt-in");
assert.match(files.otp, /Service OTP non configure/, "OTP must fail closed when SMS is not configured");

assert.match(files.cleanup, /ALLOW_DESTRUCTIVE_ADMIN_CLEANUP/, "destructive cleanup must be feature-flagged");

console.log("security smoke tests passed");