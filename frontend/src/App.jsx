import { useState, useEffect } from 'react'
import axios from 'axios'
import AddProduct from './components/AddProduct'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import Register from './components/Register'
import News from './components/News'
import NewsAPI from './components/NewsAPI'
import './App.css'

const API_URL = 'http://localhost:3001/api'

function App() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showNews, setShowNews] = useState(false)
  const [showNewsAPI, setShowNewsAPI] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        await Promise.all([fetchProducts(), fetchCategories()])
      } catch (err) {
        setError('Không thể tải dữ liệu. Kiểm tra kết nối backend.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const fetchProducts = async () => {
    console.log('Fetching products from:', `${API_URL}/products`)
    const response = await axios.get(`${API_URL}/products`)
    console.log('Products response:', response.data)
    setProducts(response.data)
  }

  const fetchCategories = async () => {
    const response = await axios.get(`${API_URL}/categories`)
    setCategories(response.data)
  }

  const reloadProducts = async () => {
    setLoading(true)
    setError('')
    try {
      await fetchProducts()
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
    alert(`Đã thêm ${product.name} vào giỏ hàng!`)
  }

  const handleProductAdded = (newProduct) => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === newProduct.id ? newProduct : p))
      alert(`Đã cập nhật sản phẩm ${newProduct.name}!`)
    } else {
      setProducts([...products, newProduct])
      alert(`Đã thêm sản phẩm ${newProduct.name}!`)
    }
  }

  const editProduct = (product) => {
    setEditingProduct(product)
    setShowAddProduct(true)
  }

  const closeModal = () => {
    setShowAddProduct(false)
    setEditingProduct(null)
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  const handleOrderSuccess = (orderData) => {
    alert(`Đặt hàng thành công! Mã đơn hàng: ${orderData.order.id}`)
    setCart([])
    setShowCart(false)
    setShowCheckout(false)
  }

  const deleteProduct = async (productId, productName) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${productName}"?`)) return
    
    try {
      await axios.delete(`${API_URL}/products/${productId}`)
      setProducts(products.filter(p => p.id !== productId))
      alert(`Đã xóa sản phẩm ${productName}!`)
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Lỗi xóa sản phẩm')
    }
  }

  const filteredProducts = selectedCategory 
    ? products.filter(product => product.category === selectedCategory)
    : products

  return (
    <div className="app">
      <header className="header">
        <h1>Shop Quần Áo</h1>
        <div className="header-actions">
          <button 
            className="add-product-btn"
            onClick={() => setShowAddProduct(true)}
          >
            + Thêm sản phẩm
          </button>
          <button 
            className="register-btn"
            onClick={() => setShowRegister(true)}
          >
            Đăng ký
          </button>

          <div 
            className="cart-info"
            onClick={() => setShowCart(true)}
          >
            Giỏ hàng: {cart.reduce((total, item) => total + item.quantity, 0)} sản phẩm
          </div>
        </div>
      </header>

      <nav className="categories">
        <button 
          className={selectedCategory === '' ? 'active' : ''}
          onClick={() => setSelectedCategory('')}
        >
          Tất cả
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            className={selectedCategory === category.id ? 'active' : ''}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
        <button 
          className="reload-btn"
          onClick={reloadProducts}
          disabled={loading}
        >
          {loading ? 'Đang tải...' : '🔄 Tải lại'}
        </button>
      </nav>

      <main className="products">
        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="no-products">Không có sản phẩm nào</div>
        )}
        {!loading && filteredProducts.map(product => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} />
            <button 
              className="cart-btn"
              onClick={() => addToCart(product)}
            >
              + Giỏ hàng
            </button>
            <h3>{product.name}</h3>
            <p className="description">{product.description}</p>
            <p className="price">{product.price.toLocaleString('vi-VN')}đ</p>
            <div className="card-buttons">
              <button 
                className="edit-btn"
                onClick={() => editProduct(product)}
              >
                Sửa
              </button>
              <button 
                className="delete-product-btn"
                onClick={() => deleteProduct(product.id, product.name)}
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </main>
      
      {showAddProduct && (
        <AddProduct
          categories={categories}
          onProductAdded={handleProductAdded}
          onClose={closeModal}
          editProduct={editingProduct}
        />
      )}
      
      {showCart && (
        <Cart
          cart={cart}
          onClose={() => setShowCart(false)}
          onRemoveFromCart={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onCheckout={() => {
            setShowCart(false)
            setShowCheckout(true)
          }}
        />
      )}
      
      {showCheckout && (
        <Checkout
          cart={cart}
          total={cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
          onClose={() => setShowCheckout(false)}
          onOrderSuccess={handleOrderSuccess}
        />
      )}
      
      {showRegister && (
        <Register
          onClose={() => setShowRegister(false)}
        />
      )}
      
      {showNews && (
        <News
          onClose={() => setShowNews(false)}
        />
      )}
      
      {showNewsAPI && (
        <NewsAPI
          onClose={() => setShowNewsAPI(false)}
        />
      )}
      
      <footer className="footer">
        <button 
          className="news-btn"
          onClick={() => setShowNews(true)}
        >
          Tin tức (Local)
        </button>
        <button 
          className="news-btn"
          onClick={() => setShowNewsAPI(true)}
        >
          Tin tức (API)
        </button>
      </footer>
    </div>
  )
}

export default App