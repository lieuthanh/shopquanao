const Cart = ({ cart, onClose, onRemoveFromCart, onUpdateQuantity, onCheckout }) => {
  console.log('Cart items:', cart)
  
  const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
  const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0)

  return (
    <div className="modal-overlay">
      <div className="modal cart-modal">
        <h2>Giỏ hàng ({totalItems} sản phẩm)</h2>
        
        {cart.length === 0 ? (
          <p>Giỏ hàng trống</p>
        ) : (
          <>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} />
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>{item.price.toLocaleString('vi-VN')}đ</p>
                  </div>
                  <div className="quantity-controls">
                    <button onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) - 1)}>-</button>
                    <span>{item.quantity || 1}</span>
                    <button onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}>+</button>
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => onRemoveFromCart(item.id)}
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
            
            <div className="cart-total">
              <h3>Tổng: {total.toLocaleString('vi-VN')}đ</h3>
            </div>
          </>
        )}
        
        <div className="modal-buttons">
          <button type="button" onClick={onClose}>Đóng</button>
          {cart.length > 0 && (
            <button className="checkout-btn" onClick={onCheckout}>Thanh toán</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Cart