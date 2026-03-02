const pool = require('../db');

pool.execute('SELECT reference_number, full_name FROM farmers LIMIT 10')
  .then(([rows]) => {
    console.log('Farmers:', rows);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
