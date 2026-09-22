import './index.css'
import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'

import { CartProvider } from './context/CartContext'
import { OrderProvider } from './context/OrderContext'
import { AuthProvider } from './context/AuthContext'

import Navbar from './components/Navbar'
import Footer from './components/Footer'

import HomePage from './page/Homepage'
import CoursePage from './page/CoursePage'
import ProductDetail from './page/CourseDetail'
import Aboutpage from './page/Aboutpage'
import ContactPage from './page/ContactPage'
import Buy from './page/Buy'
import Checkout from './page/Checkout'
import Success from './page/Success'
import Cart from './page/Cart'
import Login from './page/Login'
import Register from './page/Register'

import AOS from 'aos'
import 'aos/dist/aos.css'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    })
  }, [])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            <Navbar />
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/course" element={<CoursePage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/about" element={<Aboutpage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/buy" element={<Buy />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<Success />} />
            <Route path="/success/:orderId" element={<Success />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
          <Footer />
          </OrderProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App