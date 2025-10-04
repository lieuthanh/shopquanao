import { useState } from 'react'
import axios from 'axios'

const Checkout = ({ cart, total, onClose, onOrderSuccess }) => {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    note: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    setLoading(true)
    try {
      const orderData = {
        customer: customerInfo,
        items: cart,
        total: total,
        orderDate: new Date().toISOString()
      }

      const response = await axios.post('http://localhost:3001/api/orders', orderData)
      onOrderSuccess(response.data)
      onClose()
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Lỗi tạo đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal checkout-modal">
        <h2>Thanh toán</h2>
        
        <div className="order-summary">
          <h3>Đơn hàng ({cart.length} sản phẩm)</h3>
          {cart.map(item => (
            <div key={item.id} className="order-item">
              <span>{item.name} x {item.quantity}</span>
              <span>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
            </div>
          ))}
          <div className="order-total">
            <strong>Tổng: {total.toLocaleString('vi-VN')}đ</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <h3>Thông tin giao hàng</h3>
          <input
            type="text"
            placeholder="Họ tên *"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
            required
          />
          <input
            type="tel"
            placeholder="Số điện thoại *"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
            required
          />
          <textarea
            placeholder="Địa chỉ giao hàng *"
            value={customerInfo.address}
            onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
            required
          />
          <textarea
            placeholder="Ghi chú (tùy chọn)"
            value={customerInfo.note}
            onChange={(e) => setCustomerInfo({...customerInfo, note: e.target.value})}
          />
          
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>Hủy</button>
            <button type="submit" disabled={loading} className="checkout-btn">
              {loading ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Checkout