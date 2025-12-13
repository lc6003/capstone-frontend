import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"

const API_URL = 'http://localhost:3000/api'

function getToken() {
    return localStorage.getItem('authToken')
}

export default function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: ""
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setFormData({
          username: data.user.username,
          fullName: data.user.fullName,
          email: data.user.email
        })
      } else {
        setError("Failed to load user data")
      }
    } catch (err) {
      console.error('Failed to load user data:', err)
      setError("Failed to load user data")
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`${API_URL}/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setSuccess("Profile updated successfully!")
        setIsEditing(false)
        
        // Update localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          username: data.user.username,
          fullName: data.user.fullName,
          email: data.user.email
        }))
      } else {
        setError(data.error || "Failed to update profile")
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
      setError("Failed to update profile")
    }
  }

  async function handleLogout() {
    const theme = localStorage.getItem("cashvelo_theme")
    
    await signOut(auth)
    localStorage.clear()
    sessionStorage.clear()
    
    if (theme) {
      localStorage.setItem("cashvelo_theme", theme)
    }
    
    window.location.href = "/"
  }

  function handleDeleteAccount() {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.")) {
      deleteAccount()
    }
  }

  async function deleteAccount() {
    try {
      const response = await fetch(`${API_URL}/user`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })

      if (response.ok) {
        const theme = localStorage.getItem("cashvelo_theme")
        
        await signOut(auth)
        localStorage.clear()
        sessionStorage.clear()
        
        if (theme) {
          localStorage.setItem("cashvelo_theme", theme)
        }
        
        window.location.href = "/"
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete account")
      }
    } catch (err) {
      console.error('Failed to delete account:', err)
      setError("Failed to delete account")
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container dash">
        <div className="grid">
          <section className="card col-12">
            <p>Loading...</p>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        <section className="card col-12">
          <h2>Account Settings</h2>
          <p className="muted">Manage your account information and preferences.</p>
        </section>

        {error && (
          <section className="card col-12" style={{ background: "#fee2e2", borderColor: "#fca5a5" }}>
            <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>
          </section>
        )}

        {success && (
          <section className="card col-12" style={{ background: "#d1fae5", borderColor: "#6ee7b7" }}>
            <p style={{ color: "#059669", margin: 0 }}>{success}</p>
          </section>
        )}

        <section className="card col-12">
          <h3>Profile Information</h3>
          
          {!isEditing ? (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <p className="muted" style={{ marginBottom: "0.25rem" }}>Username</p>
                <p style={{ fontSize: "1.1rem" }}>{user?.username || "N/A"}</p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <p className="muted" style={{ marginBottom: "0.25rem" }}>Full Name</p>
                <p style={{ fontSize: "1.1rem" }}>{user?.fullName || "N/A"}</p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <p className="muted" style={{ marginBottom: "0.25rem" }}>Email</p>
                <p style={{ fontSize: "1.1rem" }}>{user?.email || "N/A"}</p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <p className="muted" style={{ marginBottom: "0.25rem" }}>Member Since</p>
                <p style={{ fontSize: "1.1rem" }}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>

              <button className="btn" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label htmlFor="username" className="label">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="input"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label htmlFor="fullName" className="label">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="input"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row" style={{ gap: "0.5rem" }}>
                <button type="submit" className="btn">Save Changes</button>
                <button 
                  type="button" 
                  className="btn secondary" 
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      username: user.username,
                      fullName: user.fullName,
                      email: user.email
                    })
                    setError("")
                    setSuccess("")
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="card col-12">
          <h3>Account Actions</h3>
          <div className="row" style={{ gap: "1rem", marginTop: "1rem" }}>
            <button className="btn secondary" onClick={handleLogout}>
              Logout
            </button>
            <button className="btn danger" onClick={handleDeleteAccount}>
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}




