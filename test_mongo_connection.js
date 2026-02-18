require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('MONGO_URL:', process.env.MONGO_URL ? 'Set' : 'Not set');
  
  try {
    const start = Date.now();
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 30000,
      bufferCommands: false,
    });
    const end = Date.now();
    console.log(`✅ Connected successfully in ${end - start}ms`);
    console.log('Connection state:', mongoose.connection.readyState);
    
    // Test a simple query
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('Test', testSchema);
    
    const queryStart = Date.now();
    const result = await TestModel.find().limit(1);
    const queryEnd = Date.now();
    console.log(`✅ Query executed in ${queryEnd - queryStart}ms`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();