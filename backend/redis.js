const redis = require('redis');

let client = null;
let isConnected = false;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL
    });

    client.on('error', (err) => {
      console.log('⚠️ [REDIS] Client Error:', err.message);
      isConnected = false;
    });

    client.on('connect', () => {
      console.log('✅ [REDIS] Connected successfully');
      isConnected = true;
    });

    client.on('disconnect', () => {
      console.log('❌ [REDIS] Disconnected');
      isConnected = false;
    });

    await client.connect();
  } catch (error) {
    console.log('⚠️ [REDIS] Connection failed:', error.message);
    console.log('📝 [REDIS] Backend will continue without Redis caching');
    client = null;
    isConnected = false;
  }
};

const getRedisClient = () => {
  return (client && isConnected) ? client : null;
};

module.exports = { connectRedis, getRedisClient };