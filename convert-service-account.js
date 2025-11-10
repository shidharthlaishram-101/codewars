// Helper script to convert serviceAccountKey.json to single-line format for Vercel
// Usage: node convert-service-account.js

const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  // Read the JSON file
  const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
  const jsonData = JSON.parse(fileContent);
  
  // Convert to single-line string (this preserves \n in private_key)
  const singleLine = JSON.stringify(jsonData);
  
  console.log('='.repeat(80));
  console.log('✅ Service Account JSON converted to single-line format');
  console.log('='.repeat(80));
  console.log('');
  console.log('📋 Copy this entire string (including the quotes) to Vercel:');
  console.log('');
  console.log(singleLine);
  console.log('');
  console.log('='.repeat(80));
  console.log('📝 Instructions:');
  console.log('1. Copy the string above (everything between the lines)');
  console.log('2. Go to Vercel → Your Project → Settings → Environment Variables');
  console.log('3. Add variable: FIREBASE_SERVICE_ACCOUNT_KEY');
  console.log('4. Paste the copied string as the value');
  console.log('5. Select all environments (Production, Preview, Development)');
  console.log('6. Save and redeploy your project');
  console.log('='.repeat(80));
  console.log('');
  console.log('✅ Validation:');
  console.log('   - Length:', singleLine.length, 'characters');
  console.log('   - Project ID:', jsonData.project_id);
  console.log('   - Client Email:', jsonData.client_email);
  console.log('   - Has private_key:', !!jsonData.private_key);
  console.log('');
  
  // Also save to a file for easy copy-paste
  const outputPath = path.join(__dirname, 'serviceAccountKey-singleline.txt');
  fs.writeFileSync(outputPath, singleLine);
  console.log('💾 Also saved to:', outputPath);
  console.log('');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

