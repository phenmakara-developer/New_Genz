import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import logoIcon from "../assets/logo.png"

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { totalItems } = useCart()
  const { user, logout } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
  }

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="nav-container">
        <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src={logoIcon} alt="Genz Wear" className="nav-logo-img" />
          <span className="nav-logo-text">Genz<span style={{ color: 'var(--accent)' }}>.Wear</span></span>
        </Link>

        <ul className={`nav-menu ${mobileOpen ? 'nav-menu-open' : ''}`}>
          <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link></li>
          <li><Link to="/course" className={location.pathname.startsWith('/course') ? 'active' : ''}>Shop</Link></li>
          <li><Link to="/about" className={location.pathname.startsWith('/about') ? 'active' : ''}>About</Link></li>
          <li><Link to="/contact" className={location.pathname.startsWith('/contact') ? 'active' : ''}>Contact</Link></li>
          <li>
            <div className="mobile-auth">
              {user ? (
                <>
                  <span className="mobile-auth-greet">Signed in as {user.name}</span>
                  <Link to="/cart">My Cart</Link>
                  <button onClick={handleLogout}>Log Out</button>
                </>
              ) : (
                <>
                  <Link to="/login">Log In</Link>
                  <Link to="/register">Create Account</Link>
                </>
              )}
            </div>
          </li>
        </ul>

        <div className="nav-right">
          <div className="nav-auth">
            {user ? (
              <div className="nav-auth-user">
                <span className="nav-avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="nav-auth-name">{user.name.split(' ')[0]}</span>
                <button
                  className="nav-auth-logout"
                  onClick={handleLogout}
                  title="Log out"
                  aria-label="Log out"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="nav-auth-btn">Log In</Link>
                <Link to="/register" className="nav-auth-btn primary">Sign Up</Link>
              </>
            )}
          </div>

          <Link to="/cart" className="nav-cart-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
          </Link>

          <button className="nav-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
