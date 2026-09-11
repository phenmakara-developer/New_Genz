import { useState, useRef, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Courses from '../data/Courses'
import { useCart } from '../context/CartContext'
import { useOrders } from '../context/OrderContext'
import qrCode from '../assets/qr_payment.jpg'
import { sendOrderToTelegram, isTelegramConfigured } from '../lib/telegram'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const MAX_SIZE = 5 * 1024 * 1024

function Checkout() {
  const { id } = useParams()
  const { items: cartItems, subtotal: cartTotal, clearCart } = useCart()
  const { placeOrder } = useOrders()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const product = id ? Courses.find((c) => c.id === Number(id)) : null

  const checkoutItems = useMemo(() => {
    if (product) {
      return [{ title: product.title, quantity: 1, price: product.price, image: product.img }]
    }
    return cartItems.map((i) => ({ title: i.title, quantity: i.quantity, price: i.price, image: i.image }))
  }, [product, cartItems])

  const totalAmount = useMemo(() => {
    if (product) return product.price
    return cartTotal
  }, [product, cartTotal])

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    note: '',
  })
  const [delivery, setDelivery] = useState({ address: '', city: '', district: '', ward: '' })
  const [deliveryMethod, setDeliveryMethod] = useState('standard')
  const [screenshot, setScreenshot] = useState(null)
  const [preview, setPreview] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedOrder, setSavedOrder] = useState(null)

  if (!product && cartItems.length === 0) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Nothing to Checkout</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Your cart is empty.</p>
          <Link to="/course" className="btn btn-dark btn-block">Browse Shop</Link>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    setErrors((prev) => ({ ...prev, screenshot: '' }))
    if (!file) { setScreenshot(null); setPreview(''); return }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setScreenshot(null); setPreview('')
      setErrors((prev) => ({ ...prev, screenshot: 'Only JPG, JPEG, PNG or WEBP images are allowed' }))
      return
    }
    if (file.size > MAX_SIZE) {
      setScreenshot(null); setPreview('')
      setErrors((prev) => ({ ...prev, screenshot: 'File is too large. Maximum size is 5MB' }))
      return
    }
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleDeliveryChange = (e) => {
    setDelivery({ ...delivery, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const nE = {}
    if (!form.customer_name.trim()) nE.customer_name = 'Name is required'
    if (!form.phone.trim()) nE.phone = 'Phone is required'
    else if (!/^[0-9+ ]+$/.test(form.phone)) nE.phone = 'Phone contains invalid characters'
    if (!form.email.trim()) nE.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nE.email = 'Enter a valid email'
    if (!delivery.address.trim()) nE.address = 'Address is required'
    if (!delivery.city.trim()) nE.city = 'City is required'
    if (!delivery.district.trim()) nE.district = 'District is required'
    if (!delivery.ward.trim()) nE.ward = 'Ward is required'
    if (!screenshot) nE.screenshot = 'Please upload your payment screenshot'
    return nE
  }

  const sendWithRetry = async (order, attempts = 3) => {
    let lastErr
    for (let i = 0; i < attempts; i += 1) {
      try {
        await sendOrderToTelegram(order, screenshot)
        return true
      } catch (err) {
        lastErr = err
        if (i < attempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 900))
        }
      }
    }
    throw lastErr
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nE = validate()
    if (Object.keys(nE).length > 0) { setErrors(nE); return }
    setLoading(true)
    setError('')
    setSavedOrder(null)
    try {
      const items = checkoutItems.map((i) => ({
        title: i.title,
        qty: i.quantity,
        price: i.price,
      }))
      const shipping = deliveryMethod === 'express' ? 5 : 0
      const grandTotal = totalAmount + shipping
      const order = {
        customer: form.customer_name,
        email: form.email,
        phone: form.phone,
        address: `${delivery.address}, ${delivery.ward}, ${delivery.district}, ${delivery.city}`,
        note: form.note,
        items,
        total: grandTotal,
        subtotal: totalAmount,
        shipping,
        paymentMethod: deliveryMethod === 'express' ? 'QR Code (Express)' : 'QR Code',
        deliveryMethod,
      }
      const placed = placeOrder(order)

      let notifyOk = false
      if (isTelegramConfigured()) {
        try {
          await sendWithRetry(placed)
          notifyOk = true
        } catch (telegramErr) {
          console.error('Telegram order notification failed:', telegramErr)
        }
      }

      if (notifyOk) {
        if (!product) clearCart()
        navigate('/success', { state: { orderId: placed.id }, replace: true })
      } else {
        setSavedOrder(placed)
        setError(
          isTelegramConfigured()
            ? 'We could not auto-notify the store about your order. Check your internet connection and try notifying again, or continue anyway and message us directly on Telegram.'
            : 'Store notifications are not configured on this deployment. You can continue anyway, but please message us directly on Telegram so we do not miss your order.'
        )
      }
    } catch (err) {
      setError(err.message || 'Unable to submit order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const retryNotify = async () => {
    if (!savedOrder) return
    setLoading(true)
    setError('')
    try {
      await sendWithRetry(savedOrder)
      if (!product) clearCart()
      navigate('/success', { state: { orderId: savedOrder.id }, replace: true })
    } catch (err) {
      console.error('Telegram retry failed:', err)
      setError('Still could not reach Telegram. You can retry again or continue anyway and message us directly.')
    } finally {
      setLoading(false)
    }
  }

  const continueAnyway = () => {
    if (!savedOrder) return
    navigate('/success', { state: { orderId: savedOrder.id, notifyFailed: true }, replace: true })
  }

  return (
    <div className="checkout-page" data-aos="fade-up">
      <div className="checkout-wrap">
        <nav className="crumbs">
          <Link to="/">Home</Link> <span>/</span>
          <Link to="/course">Shop</Link> <span>/</span>
          <span>Checkout</span>
        </nav>

        {error && (
          <div className="alert alert-danger">
            <strong>{savedOrder ? 'Order Saved — Notification Issue' : 'Order Failed'}</strong>
            <p>{error}</p>
            {savedOrder && (
              <div className="recover-actions">
                <button type="button" className="btn btn-dark" onClick={retryNotify} disabled={loading}>
                  {loading ? 'Notifying...' : 'Retry Notify'}
                </button>
                <button type="button" className="btn btn-outline" onClick={continueAnyway} disabled={loading}>
                  Continue Anyway
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="checkout-grid">
          <div className="checkout-left">
            <div className="panel">
              <h2>{product ? 'Your Product' : `Your Cart (${checkoutItems.length} items)`}</h2>
              <div className="checkout-items-list">
                {checkoutItems.map((item, idx) => (
                  <div key={idx} className="course-summary">
                    <img src={item.image} alt={item.title} />
                    <div>
                      <h3>{item.title}</h3>
                      <div className="price">
                        <span className="price-now">${item.price}</span>
                        {item.quantity > 1 && (
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>x{item.quantity}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>Customer Information</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input name="customer_name" placeholder="Enter your full name" value={form.customer_name} onChange={handleChange} className={errors.customer_name ? 'input-error' : ''} />
                {errors.customer_name && <p className="error">{errors.customer_name}</p>}
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input name="phone" placeholder="097 000 0000" value={form.phone} onChange={handleChange} className={errors.phone ? 'input-error' : ''} />
                {errors.phone && <p className="error">{errors.phone}</p>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} className={errors.email ? 'input-error' : ''} />
                {errors.email && <p className="error">{errors.email}</p>}
              </div>
              <div className="form-group">
                <label>Note (optional)</label>
                <textarea name="note" rows="3" placeholder="Anything we should know?" value={form.note} onChange={handleChange} />
              </div>
            </div>

            <div className="panel">
              <h2>Delivery Address</h2>
              <div className="delivery-method-toggle">
                <button type="button" className={`delivery-method-btn ${deliveryMethod === 'standard' ? 'active' : ''}`} onClick={() => setDeliveryMethod('standard')}>
                  <span className="delivery-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </span>
                  <div>
                    <strong>Standard Delivery</strong>
                    <small>3-5 business days · Free</small>
                  </div>
                </button>
                <button type="button" className={`delivery-method-btn ${deliveryMethod === 'express' ? 'active' : ''}`} onClick={() => setDeliveryMethod('express')}>
                 <span className="delivery-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </span>
                  <div>
                    <strong>Express Delivery</strong>
                    <small>1-2 business days · $5</small>
                  </div>
                </button>
              </div>
              <div className="form-group">
                <label>Street Address</label>
                <input name="address" placeholder="123 Main Street" value={delivery.address} onChange={handleDeliveryChange} className={errors.address ? 'input-error' : ''} />
                {errors.address && <p className="error">{errors.address}</p>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City / Province</label>
                  <input name="city" placeholder="Ho Chi Minh City" value={delivery.city} onChange={handleDeliveryChange} className={errors.city ? 'input-error' : ''} />
                  {errors.city && <p className="error">{errors.city}</p>}
                </div>
                <div className="form-group">
                  <label>District</label>
                  <input name="district" placeholder="District 1" value={delivery.district} onChange={handleDeliveryChange} className={errors.district ? 'input-error' : ''} />
                  {errors.district && <p className="error">{errors.district}</p>}
                </div>
              </div>
              <div className="form-group">
                <label>Ward / Commune</label>
                <input name="ward" placeholder="Ward 5" value={delivery.ward} onChange={handleDeliveryChange} className={errors.ward ? 'input-error' : ''} />
                {errors.ward && <p className="error">{errors.ward}</p>}
              </div>
            </div>
          </div>

          <div className="checkout-right">
            <div className="panel payment-panel">
              <h2>Payment Method</h2>
              <p className="payment-sub">Scan the QR code to pay the amount below.</p>
              <div className="qr-box">
                <img src={qrCode} alt="Payment QR Code" className="payment-qr" />
              </div>
              <div className="amount-box">
                <span>Total Amount</span>
                <strong>${totalAmount}</strong>
              </div>
              <div className="form-group">
                <label>Upload Payment Screenshot</label>
                <div className={`upload-box ${errors.screenshot ? 'upload-error' : ''}`} onClick={() => fileRef.current?.click()}>
                  {preview ? (
                    <img src={preview} alt="Payment preview" className="upload-preview" />
                  ) : (
                    <>
                      <span className="upload-icon">+</span>
                      <p>Click to upload your screenshot</p>
                      <small>JPG, JPEG, PNG or WEBP · max 5MB</small>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: 'none' }} />
                {errors.screenshot && <p className="error">{errors.screenshot}</p>}
              </div>
            </div>

            <button type="submit" className="btn btn-block submit-order" disabled={loading}>
              {loading ? 'Submitting Order...' : 'Submit Order'}
            </button>
            {loading && <p className="submit-note">Please wait, do not close this page.</p>}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Checkout
