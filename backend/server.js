const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();
const { pool, initDB } = require('./db');
const { minioClient, bucketName, initMinio } = require('./minio');
const { connectRedis, getRedisClient } = require('./redis');
const { swaggerUi, specs } = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Multer config for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Khởi tạo database, MinIO và Redis
initDB();
initMinio();
connectRedis();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *                   image:
 *                     type: string
 *                   category:
 *                     type: string
 *                   description:
 *                     type: string
 */
app.get('/api/products', async (req, res) => {
  const redisClient = getRedisClient();
  const cacheKey = 'products:all';
  
  try {
    // Kiểm tra cache Redis trước
    if (redisClient && redisClient.isOpen) {
      const cachedProducts = await redisClient.get(cacheKey);
      if (cachedProducts) {
        console.log('📦 [REDIS] Lấy danh sách sản phẩm từ cache');
        return res.json(JSON.parse(cachedProducts));
      }
    }
    
    // Nếu không có cache, lấy từ database
    console.log('🗄️ [DATABASE] Lấy danh sách sản phẩm từ database');
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    console.log(`Found ${result.rows.length} products`);
    
    // Lưu vào Redis cache (expire sau 5 phút)
    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result.rows));
      console.log('💾 [REDIS] Đã lưu danh sách sản phẩm vào cache');
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết sản phẩm
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy danh sách danh mục
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 */
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload hình ảnh trực tiếp lên MinIO
 *     tags: [Upload]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 */
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được upload' });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    
    await minioClient.putObject(
      bucketName,
      fileName,
      req.file.buffer,
      req.file.size,
      { 'Content-Type': req.file.mimetype }
    );

    const imageUrl = `http://localhost:9000/shopquanao/${fileName}`;
    console.log(`📤 [UPLOAD] File uploaded to MinIO: ${fileName}`);
    res.json({ imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Lỗi upload file', error: error.message });
  }
});

/**
 * @swagger
 * /api/upload/to-base64:
 *   post:
 *     summary: Upload file và chuyển thành base64 với checksum
 *     tags: [Upload]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Chuyển đổi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 base64:
 *                   type: string
 *                 checksum:
 *                   type: string
 *                 filename:
 *                   type: string
 *                 size:
 *                   type: number
 */
app.post('/api/upload/to-base64', upload.single('image'), async (req, res) => {
  const crypto = require('crypto');
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được upload' });
    }

    // Tạo base64
    const base64 = req.file.buffer.toString('base64');
    
    // Tạo checksum MD5
    const checksum = crypto.createHash('md5').update(req.file.buffer).digest('hex');
    
    console.log(`🔄 [BASE64] File converted: ${req.file.originalname}, Size: ${req.file.size} bytes, Checksum: ${checksum}`);
    
    res.json({
      base64,
      checksum,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Base64 conversion error:', error);
    res.status(500).json({ message: 'Lỗi chuyển đổi file', error: error.message });
  }
});

/**
 * @swagger
 * /api/upload/from-base64:
 *   post:
 *     summary: Upload base64 lên MinIO với checksum validation
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               base64:
 *                 type: string
 *                 description: Dữ liệu base64 của file
 *                 example: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
 *               checksum:
 *                 type: string
 *                 description: MD5 checksum để validate
 *                 example: "5d41402abc4b2a76b9719d911017c592"
 *               filename:
 *                 type: string
 *                 description: Tên file
 *                 example: "test.png"
 *               mimetype:
 *                 type: string
 *                 description: MIME type của file
 *                 example: "image/png"
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                 checksum:
 *                   type: string
 *                 verified:
 *                   type: boolean
 *       400:
 *         description: Checksum không khớp hoặc thiếu dữ liệu
 */
app.post('/api/upload/from-base64', async (req, res) => {
  const crypto = require('crypto');
  
  try {
    const { base64, checksum, filename, mimetype } = req.body;
    
    if (!base64 || !checksum || !filename) {
      return res.status(400).json({ message: 'Thiếu dữ liệu: base64, checksum, filename' });
    }

    // Chuyển base64 thành buffer
    const buffer = Buffer.from(base64, 'base64');
    
    // Tạo checksum để validate
    const calculatedChecksum = crypto.createHash('md5').update(buffer).digest('hex');
    
    // Kiểm tra checksum
    if (calculatedChecksum !== checksum) {
      console.log(`❌ [CHECKSUM] Validation failed: expected ${checksum}, got ${calculatedChecksum}`);
      return res.status(400).json({ 
        message: 'Checksum không khớp', 
        expected: checksum, 
        calculated: calculatedChecksum 
      });
    }
    
    console.log(`✅ [CHECKSUM] Validation passed: ${checksum}`);
    
    // Upload lên MinIO
    const fileName = `${Date.now()}-${filename}`;
    
    await minioClient.putObject(
      bucketName,
      fileName,
      buffer,
      buffer.length,
      { 'Content-Type': mimetype || 'application/octet-stream' }
    );

    const imageUrl = `http://localhost:9000/shopquanao/${fileName}`;
    console.log(`📤 [MINIO] Base64 uploaded: ${fileName}, Size: ${buffer.length} bytes`);
    
    res.json({ 
      imageUrl, 
      checksum: calculatedChecksum,
      verified: true,
      filename: fileName
    });
  } catch (error) {
    console.error('Base64 upload error:', error);
    res.status(500).json({ message: 'Lỗi upload base64', error: error.message });
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Thêm sản phẩm mới
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thêm sản phẩm thành công
 */
app.post('/api/products', async (req, res) => {
  const redisClient = getRedisClient();
  
  try {
    const { name, price, image, category, description } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, price, image, category, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, price, image, category, description]
    );
    
    // Xóa cache khi thêm sản phẩm mới
    if (redisClient && redisClient.isOpen) {
      await redisClient.del('products:all');
      console.log('🗑️ [REDIS] Đã xóa cache products sau khi thêm mới');
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Lỗi thêm sản phẩm', error: error.message });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Cập nhật sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
app.put('/api/products/:id', async (req, res) => {
  const redisClient = getRedisClient();
  
  try {
    const { name, price, image, category, description } = req.body;
    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, image = $3, category = $4, description = $5 WHERE id = $6 RETURNING *',
      [name, price, image, category, description, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    
    // Xóa cache khi cập nhật sản phẩm
    if (redisClient && redisClient.isOpen) {
      await redisClient.del('products:all');
      console.log('🗑️ [REDIS] Đã xóa cache products sau khi cập nhật');
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Lỗi cập nhật sản phẩm', error: error.message });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Xóa sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
app.delete('/api/products/:id', async (req, res) => {
  const redisClient = getRedisClient();
  
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    
    // Xóa cache khi xóa sản phẩm
    if (redisClient && redisClient.isOpen) {
      await redisClient.del('products:all');
      console.log('🗑️ [REDIS] Đã xóa cache products sau khi xóa sản phẩm');
    }
    
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Lỗi xóa sản phẩm', error: error.message });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Tạo đơn hàng
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: string
 *                   note:
 *                     type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               total:
 *                 type: number
 *               orderDate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tạo đơn hàng thành công
 */
app.post('/api/orders', async (req, res) => {
  try {
    const { customer, items, total, orderDate } = req.body;
    const result = await pool.query(
      'INSERT INTO orders (customer_name, customer_phone, customer_address, note, items, total, order_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [customer.name, customer.phone, customer.address, customer.note || '', JSON.stringify(items), total, orderDate, 'pending']
    );
    res.json({ message: 'Đặt hàng thành công!', order: result.rows[0] });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Lỗi tạo đơn hàng', error: error.message });
  }
});

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Đăng ký tài khoản
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Email đã được sử dụng
 */
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, phone, address } = req.body;
    
    // Kiểm tra email đã tồn tại
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Tạo user mới
    const result = await pool.query(
      'INSERT INTO users (email, password, name, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, phone, address, role, created_at',
      [email, hashedPassword, name, phone, address]
    );
    
    res.status(201).json({ message: 'Đăng ký thành công', user: result.rows[0] });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi đăng ký', error: error.message });
  }
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Tìm user theo email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    
    const user = result.rows[0];
    
    // Kiểm tra mật khẩu
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    
    // Tạo JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi đăng nhập', error: error.message });
  }
});

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Lấy danh sách tin tức
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số bài viết mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách tin tức
 */
app.get('/api/news', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: 'sơn OR paint OR coating OR "sơn nước" OR "sơn dầu" OR "chống thấm" OR "sơn epoxy" OR "bột màu" OR resin OR VOC',
        language: 'vi',
        sortBy: 'publishedAt',
        page: page,
        pageSize: limit,
        apiKey: process.env.NEWS_API_KEY || 'demo'
      }
    });
    
    const articles = response.data.articles.map((article, index) => ({
      id: `news_${page}_${index}`,
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source.name,
      content: article.content,
      author: article.author || 'Fashion Editor'
    }));
    
    res.json({ 
      articles,
      pagination: {
        page,
        limit,
        total: response.data.totalResults
      }
    });
  } catch (error) {
    console.error('News API error:', error.message);
    // Fallback data
    const fallbackArticles = Array.from({ length: 10 }, (_, i) => ({
      id: `fallback_${i + 1}`,
      title: `Tin tức ngành sơn ${i + 1}`,
      description: `Thông tin mới nhất về công nghệ sơn và vật liệu ${i + 1}`,
      url: "#",
      urlToImage: `https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop&crop=center&auto=format&q=80&ixid=${i}`,
      publishedAt: new Date().toISOString(),
      source: "Paint Industry News",
      content: `Nội dung chi tiết về công nghệ sơn mới ${i + 1}. Bài viết giới thiệu các sản phẩm sơn tiên tiến và ứng dụng trong xây dựng.`,
      author: "Paint Industry Editor"
    }));
    
    res.json({
      articles: fallbackArticles,
      pagination: {
        page: 1,
        limit: 10,
        total: 50
      }
    });
  }
});

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Lấy chi tiết tin tức
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết tin tức
 *       404:
 *         description: Không tìm thấy bài viết
 */
app.get('/api/news/:id', async (req, res) => {
  try {
    const newsId = req.params.id;
    
    // Parse ID để lấy page và index
    if (newsId.startsWith('news_')) {
      const [, page, index] = newsId.split('_');
      
      // Gọi lại NewsAPI với page tương ứng
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'sơn OR paint OR coating OR "sơn nước" OR "sơn dầu" OR "chống thấm" OR "sơn epoxy" OR "bột màu" OR resin OR VOC',
          language: 'vi',
          sortBy: 'publishedAt',
          page: parseInt(page),
          pageSize: 20,
          apiKey: process.env.NEWS_API_KEY || 'demo'
        }
      });
      
      const article = response.data.articles[parseInt(index)];
      if (article) {
        return res.json({
          id: newsId,
          title: article.title,
          description: article.description,
          content: article.content || `${article.description}\n\nBài viết đầy đủ về ngành sơn có thể đọc tại: ${article.url}`,
          url: article.url,
          urlToImage: article.urlToImage,
          publishedAt: article.publishedAt,
          source: article.source.name,
          author: article.author || 'Paint Industry Editor'
        });
      }
    }
    
    // Nếu là fallback data
    if (newsId.startsWith('fallback_')) {
      const id = newsId.split('_')[1];
      return res.json({
        id: newsId,
        title: `Tin tức ngành sơn ${id}`,
        description: `Thông tin mới nhất về công nghệ sơn và vật liệu ${id}`,
        content: `Nội dung chi tiết về công nghệ sơn mới ${id}. Bài viết giới thiệu các sản phẩm sơn tiên tiến, kỹ thuật thi công và ứng dụng trong xây dựng. Chúng ta sẽ tìm hiểu về các loại sơn chống thấm, sơn epoxy và các giải pháp bảo vệ bề mặt hiện đại.`,
        url: "#",
        urlToImage: `https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixid=${id}`,
        publishedAt: new Date().toISOString(),
        source: "Paint Industry News",
        author: "Paint Industry Editor"
      });
    }
    
    res.status(404).json({ message: 'Không tìm thấy bài viết' });
  } catch (error) {
    console.error('News detail error:', error.message);
    // Fallback khi API lỗi
    res.json({
      id: req.params.id,
      title: "Tin tức ngành sơn",
      description: "Thông tin mới nhất về ngành sơn",
      content: "Nội dung chi tiết về tin tức ngành sơn. Do lỗi kết nối API, chúng tôi hiển thị nội dung mặc định về các sản phẩm sơn và công nghệ mới.",
      url: "#",
      urlToImage: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&h=600&fit=crop",
      publishedAt: new Date().toISOString(),
      source: "Paint Industry News",
      author: "Paint Industry Editor"
    });
  }
});

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Kiểm tra kết nối database
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Kết nối thành công
 *       500:
 *         description: Kết nối thất bại
 */
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connected!', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  console.log(`📊 Database: PostgreSQL`);
  console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
});