const pool = require('../db');
const bcrypt = require('bcryptjs');

const reference_number = '123456789'; 
const newPassword = 'testpassword123';

(async () => {
  try {
    const password_hash = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.execute(
      'UPDATE farmers SET password_hash = ? WHERE reference_number = ?',
      [password_hash, reference_number]
    );
    console.log(`Password reset for ${reference_number}. Affected rows: ${result.affectedRows}`);
    process.exit(0);
  } catch (err) {
    console.error('Error resetting password:', err);
    process.exit(1);
  }
})();
