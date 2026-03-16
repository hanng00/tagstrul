#!/usr/bin/env node
/**
 * Generate VAPID keys for web push notifications.
 * Run with: npx ts-node scripts/generate-vapid-keys.ts
 * Or: bun scripts/generate-vapid-keys.ts
 */

import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys Generated!\n');
console.log('Add these to your SAM deployment:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\nAlso add the public key to your frontend .env:');
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
