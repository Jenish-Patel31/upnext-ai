// test-connection.js - Test MongoDB Atlas connection
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

console.log('🔍 Testing MongoDB Atlas connection...');
console.log(`📡 URI: ${MONGO_URI ? MONGO_URI.replace(/\/\/.*@/, '//***:***@') : 'NOT SET'}`);

if (!MONGO_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('💡 Please check your .env file');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('🔄 Attempting to connect...');
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`📊 Database: ${MONGO_URI.split('/').pop().split('?')[0]}`);
    console.log(`🌐 Connection state: ${mongoose.connection.readyState}`);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📚 Collections found: ${collections.length}`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔍 Error details:');
    console.error(`   Code: ${error.code}`);
    console.error(`   Name: ${error.name}`);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Tip: Check if your MongoDB Atlas cluster is running');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Tip: Check if your IP is whitelisted in MongoDB Atlas');
    } else if (error.code === 'EAUTH') {
      console.error('💡 Tip: Check your username and password in the connection string');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Tip: Check your internet connection and firewall settings');
    }
    
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Connection closed through app termination');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

testConnection();
