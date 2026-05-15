import '../index.css'
import { useAuth } from '../context/AuthContext'


export default function Layout({ children }) {
  const { user, logout } = useAuth()
  return (
    <div>
      <nav className="navbar">
        <div className="navbar-inner">
          <h1 className="navbar-brand">InventoryPro</h1>
          <div className="navbar-user">
            <span>Hi, {user?.first_name || user?.username}</span>
            <ThemeToggle />
            <button onClick={logout} className="btn btn-danger">Logout</button>
          </div>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  )
}