#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if .env.local exists
const envLocalPath = path.join(__dirname, '../.env.local');
const hasEnvLocal = fs.existsSync(envLocalPath);

console.log(`.env.local exists: ${hasEnvLocal}`);

// Prefix with dotenv if .env.local exists, otherwise run directly
const prefix = hasEnvLocal ? 'dotenv -e .env.local --' : '';

try {
  // Prisma generate
  console.log('Running prisma generate...');
  execSync(`${prefix} prisma generate`, { stdio: 'inherit' });

  // Prisma db push
  console.log('Running prisma db push...');
  execSync(`${prefix} prisma db push --skip-generate`, { stdio: 'inherit' });

  // Next build
  console.log('Running next build...');
  execSync('next build', { stdio: 'inherit' });

  console.log('Build complete!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
