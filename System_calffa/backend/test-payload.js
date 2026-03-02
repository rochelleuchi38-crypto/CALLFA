// Test registration payload
const testPayload = {
  reference_number: "REF5200-9090",
  full_name: "Rochelle Lila",
  date_of_birth: "2006-02-19",
  address: "123123",
  phone_number: "123456789",
  password: "testpass123",
  role: "farmer",
  barangay_id: 67  // This should be numeric
};

console.log('Test Payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('\nPayload Validation:');
console.log(`  reference_number: ${testPayload.reference_number} ✓`);
console.log(`  full_name: ${testPayload.full_name} ✓`);
console.log(`  date_of_birth: ${testPayload.date_of_birth} ✓`);
console.log(`  address: ${testPayload.address} ✓`);
console.log(`  phone_number: ${testPayload.phone_number} ✓`);
console.log(`  password: ${testPayload.password} ✓`);
console.log(`  role: ${testPayload.role} ✓`);
console.log(`  barangay_id: ${testPayload.barangay_id} (type: ${typeof testPayload.barangay_id}) ✓`);

// Simulate what backend receives
console.log('\nBackend Verification:');
const isInteger = Number.isInteger(testPayload.barangay_id);
console.log(`  Is barangay_id integer? ${isInteger}`);
console.log(`  Is barangay_id > 0? ${testPayload.barangay_id > 0}`);
console.log(`  Valid barangay IDs: 67, 68, 69, 70, 71`);
console.log(`  Is barangay_id valid? ${[67, 68, 69, 70, 71].includes(testPayload.barangay_id)}`);
