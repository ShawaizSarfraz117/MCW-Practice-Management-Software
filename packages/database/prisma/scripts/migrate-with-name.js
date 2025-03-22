// scripts/migrate-with-name.js - Apply migrations to SQL Server and keep SQLite in sync
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get migration name from command line argument
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Error: Migration name is required');
  console.error('Usage: node scripts/migrate-with-name.js your-migration-name');
  process.exit(1);
}

try {
  // Step 1: Apply SQL Server migration
  console.log('\n=== Migrating SQL Server Database ===');
  execSync(`npx prisma migrate dev --name ${migrationName} --schema=./prisma/schema.prisma`, { stdio: 'inherit' });
  
  // Step 2: Convert schema from SQL Server to SQLite
  console.log('\n=== Converting Schema to SQLite ===');
  execSync('node ./prisma/scripts/sqlite-converter.js', { stdio: 'inherit' });

  // Step 3: Push the schema directly to SQLite (skip migration history)
  console.log('\n=== Pushing Schema Changes to SQLite ===');
  execSync('npx prisma db push --schema=./prisma/schema-sqlite.prisma --skip-generate', { stdio: 'inherit' });

  console.log('\n✅ All done!');
  console.log('- SQL Server: Migration applied and recorded');
  console.log('- SQLite: Schema updated to match SQL Server');
} catch (error) {
  console.error('\n❌ Process failed:', error.message);
  process.exit(1);
}