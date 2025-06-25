import { testConnection } from './index';

async function main() {
  console.log('Testing database connection...');
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('✅ Database setup is working correctly!');
    process.exit(0);
  } else {
    console.log('❌ Database connection failed. Please check your configuration.');
    process.exit(1);
  }
}

main().catch(console.error);
