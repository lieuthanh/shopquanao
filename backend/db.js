const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Tạo bảng khi khởi động
const initDB = async () => {
  try {
    // Tạo bảng categories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )
    `);

    // Tạo bảng products
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        price INTEGER NOT NULL,
        image VARCHAR(500),
        category VARCHAR(50) REFERENCES categories(id),
        description TEXT
      )
    `);

    // Tạo bảng users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng orders
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_address TEXT NOT NULL,
        note TEXT,
        items JSONB NOT NULL,
        total INTEGER NOT NULL,
        order_date TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Thêm dữ liệu mẫu categories
    await pool.query(`
      INSERT INTO categories (id, name) VALUES 
      ('ao-nam', 'Áo Nam'),
      ('ao-nu', 'Áo Nữ'),
      ('quan-nam', 'Quần Nam'),
      ('quan-nu', 'Quần Nữ'),
      ('vay-dam', 'Váy & Đầm')
      ON CONFLICT (id) DO NOTHING
    `);

    // Thêm dữ liệu mẫu products với hình ảnh mới
    const productCount = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, price, image, category, description) VALUES 
        ('Áo thun nam basic', 299000, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop', 'ao-nam', 'Áo thun nam chất liệu cotton 100%'),
        ('Quần jean nữ skinny', 599000, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300&h=400&fit=crop', 'quan-nu', 'Quần jean nữ form skinny thời trang'),
        ('Váy midi hoa', 450000, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop', 'vay-dam', 'Váy midi họa tiết hoa xinh xắn'),
        ('Áo sơ mi trắng', 399000, 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=300&h=400&fit=crop', 'ao-nu', 'Áo sơ mi trắng công sở thanh lịch')
      `);
      console.log('✅ Sample products added with new images');
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

module.exports = { pool, initDB };