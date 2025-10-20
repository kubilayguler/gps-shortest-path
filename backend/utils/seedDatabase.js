// Seed database with initial data
const sequelize = require('../config/db');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
  try {
    // Wait for sequelize to be ready
    await sequelize.authenticate();
    console.log('Running seed script...');

    // Read and execute seed SQL
    const seedSQL = fs.readFileSync(path.join(__dirname, '../init.sql'), 'utf8');
    
    // Remove comment lines first
    const cleanedSQL = seedSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Split by semicolon and execute each statement
    const statements = cleanedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        const result = await sequelize.query(statement);
        console.log(`✓ Statement ${i + 1}/${statements.length} executed successfully`);
        if (result && result[0]) {
          console.log(`  Affected rows: ${result[0].length || result[1] || 0}`);
        }
      } catch (error) {
        // Ignore duplicate key errors (data already exists)
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          console.log(`⚠ Statement ${i + 1}/${statements.length} skipped (duplicate)`);
        } else {
          console.error(`✗ Statement ${i + 1}/${statements.length} failed:`);
          console.error('  Statement:', statement.substring(0, 150));
          console.error('  Error:', error.message);
        }
      }
    }

    console.log('✓ Database seeded successfully!');
  } catch (error) {
    console.error('Seed script error:', error);
  }
}

module.exports = seedDatabase;
