import { Link, useLocation, Navigate } from "react-router-dom"

export default function DashboardLayout({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('authToken')
  
  // Redirect to login if not authenticated
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return (
    <>
      <nav style={{
        background: "#fff",
        padding: "1rem 2rem",
        borderBottom: "1px solid #e5e7eb",
        marginBottom: "2rem"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>💰 Cashvelo</h2>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <Link 
                to="/dashboard" 
                style={{
                  textDecoration: "none",
                  color: location.pathname === "/dashboard" ? "#000" : "#666",
                  fontWeight: location.pathname === "/dashboard" ? "600" : "400",
                  borderBottom: location.pathname === "/dashboard" ? "2px solid #000" : "none",
                  paddingBottom: "4px"
                }}
              >
                Dashboard
              </Link>
              <Link 
                to="/budget" 
                style={{
                  textDecoration: "none",
                  color: location.pathname === "/budget" ? "#000" : "#666",
                  fontWeight: location.pathname === "/budget" ? "600" : "400",
                  borderBottom: location.pathname === "/budget" ? "2px solid #000" : "none",
                  paddingBottom: "4px"
                }}
              >
                Budget
              </Link>
              <Link 
                to="/expenses" 
                style={{
                  textDecoration: "none",
                  color: location.pathname === "/expenses" ? "#000" : "#666",
                  fontWeight: location.pathname === "/expenses" ? "600" : "400",
                  borderBottom: location.pathname === "/expenses" ? "2px solid #000" : "none",
                  paddingBottom: "4px"
                }}
              >
                Expenses
              </Link>
              <Link 
                to="/insights" 
                style={{
                  textDecoration: "none",
                  color: location.pathname === "/insights" ? "#000" : "#666",
                  fontWeight: location.pathname === "/insights" ? "600" : "400",
                  borderBottom: location.pathname === "/insights" ? "2px solid #000" : "none",
                  paddingBottom: "4px"
                }}
              >
                Insights
              </Link>
            </div>
          </div>
          <Link to="/settings" className="btn secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        </div>
      </nav>
      {children}
    </>
  )
}