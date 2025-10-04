import { useState } from 'react'
import axios from 'axios'
import ImageUpload from './ImageUpload'

const AddProduct = ({ categories, onProductAdded, onClose, editProduct = null }) => {
  const [product, setProduct] = useState(
    editProduct || {
      name: '',
      price: '',
      image: '',
      category: '',
      description: ''
    }
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!product.name || !product.price || !product.category) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    setLoading(true)
    try {
      const url = editProduct 
        ? `http://localhost:3001/api/products/${editProduct.id}`
        : 'http://localhost:3001/api/products'
      const method = editProduct ? 'put' : 'post'
      
      const response = await axios[method](url, {
        ...product,
        price: parseInt(product.price)
      })
      onProductAdded(response.data)
      onClose()
    } catch (error) {
      console.error('Error saving product:', error)
      alert(editProduct ? 'Lỗi cập nhật sản phẩm' : 'Lỗi thêm sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{editProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Tên sản phẩm"
            value={product.name}
            onChange={(e) => setProduct({...product, name: e.target.value})}
          />
          <input
            type="number"
            placeholder="Giá"
            value={product.price}
            onChange={(e) => setProduct({...product, price: e.target.value})}
          />
          <select
            value={product.category}
            onChange={(e) => setProduct({...product, category: e.target.value})}
          >
            <option value="">Chọn danh mục</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <textarea
            placeholder="Mô tả"
            value={product.description}
            onChange={(e) => setProduct({...product, description: e.target.value})}
          />
          <ImageUpload onImageUploaded={(url) => setProduct({...product, image: url})} />
          {product.image && <img src={product.image} alt="Preview" className="image-preview" />}
          
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>Hủy</button>
            <button type="submit" disabled={loading}>
              {loading 
                ? (editProduct ? 'Đang cập nhật...' : 'Đang thêm...') 
                : (editProduct ? 'Cập nhật' : 'Thêm sản phẩm')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProduct