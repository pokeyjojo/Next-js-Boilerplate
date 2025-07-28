#!/usr/bin/env node

/**
 * Test script for DigitalOcean Spaces configuration
 * Run with: npm run test:digitalocean
 */

import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { deleteImage, uploadImage } from '../src/libs/DigitalOceanSpaces';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Define required environment variables
const requiredEnvVars = [
  'DO_SPACES_ENDPOINT',
  'DO_SPACES_BUCKET',
  'DO_SPACES_ACCESS_KEY_ID',
  'DO_SPACES_SECRET_ACCESS_KEY',
];

async function testDigitalOceanSpaces() {
  console.log('🧪 Testing DigitalOcean Spaces Configuration...\n');

  // Debug: Show what environment variables are loaded
  console.log('🔍 Environment variables loaded:');

  requiredEnvVars.forEach((varName) => {
    const value = process.env[varName];
    console.log(`   ${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
    if (value) {
      console.log(`      Value: ${varName.includes('SECRET') ? '***hidden***' : value}`);
    }
  });
  console.log('');

  try {
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89,
      0x50,
      0x4E,
      0x47,
      0x0D,
      0x0A,
      0x1A,
      0x0A,
      0x00,
      0x00,
      0x00,
      0x0D,
      0x49,
      0x48,
      0x44,
      0x52,
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
      0x01,
      0x08,
      0x02,
      0x00,
      0x00,
      0x00,
      0x90,
      0x77,
      0x53,
      0xDE,
      0x00,
      0x00,
      0x00,
      0x0C,
      0x49,
      0x44,
      0x41,
      0x54,
      0x08,
      0x99,
      0x01,
      0x01,
      0x00,
      0x00,
      0x00,
      0xFF,
      0xFF,
      0x00,
      0x00,
      0x00,
      0x02,
      0x00,
      0x01,
      0xE2,
      0x21,
      0xBC,
      0x33,
      0x00,
      0x00,
      0x00,
      0x00,
      0x49,
      0x45,
      0x4E,
      0x44,
      0xAE,
      0x42,
      0x60,
      0x82,
    ]);

    console.log('📤 Uploading test image...');
    const uploadedUrl = await uploadImage(testImageBuffer, 'test');
    console.log('✅ Upload successful!');
    console.log(`📎 Image URL: ${uploadedUrl}\n`);

    // Test if the image is accessible
    console.log('🔍 Testing image accessibility...');
    const response = await fetch(uploadedUrl);
    if (response.ok) {
      console.log('✅ Image is accessible via URL\n');
    } else {
      console.log('❌ Image is not accessible via URL\n');
    }

    // Test deletion
    console.log('🗑️  Testing image deletion...');
    await deleteImage(uploadedUrl);
    console.log('✅ Deletion successful!\n');

    console.log('🎉 All tests passed! DigitalOcean Spaces is configured correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your environment variables are set correctly');
    console.log('2. Verify your API keys have the correct permissions');
    console.log('3. Ensure your Space is set to public');
    console.log('4. Check your Space endpoint URL');
    process.exit(1);
  }
}

// Check if environment variables are set
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.log('\n📝 Please add these to your .env.local file and try again.');
  process.exit(1);
}

testDigitalOceanSpaces();
