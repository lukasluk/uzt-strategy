#!/usr/bin/env node
const { hashMetaAdminPassword } = require('../src/security');

const password = String(process.argv[2] || '').trim();
if (!password) {
  console.error('Usage: node backend/scripts/generate-meta-admin-hash.js "<password>"');
  process.exit(1);
}

const hash = hashMetaAdminPassword(password);
console.log(hash);
