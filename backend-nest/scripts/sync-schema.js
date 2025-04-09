const dataSource = require('../ormconfig.js');

async function syncSchema() {
  try {
    await dataSource.initialize();
    console.log('Database schema synchronized successfully.');
    await dataSource.destroy();
  } catch (error) {
    console.error('Error synchronizing schema:', error);
  }
}

syncSchema();