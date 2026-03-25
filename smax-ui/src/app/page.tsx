'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!username || !password) {
      alert('Please enter both username and password')
      return
    }

    try {
      const response = await fetch('http://localhost:8082/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('Login successful:', data)
        // Store xsrf_token for future requests
        if (data.xsrf_token) {
          localStorage.setItem('xsrf_token', data.xsrf_token)
        }
        // Navigate to dashboard page
        router.push('/dashboard')
      } else {
        alert(data.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Failed to connect to server')
    }
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '3rem',
    }}>
      <h1 style={{
        color: '#ffffff',
        fontSize: '8rem',
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        margin: 0,
      }}>
        EzMAX 4 noobz
      </h1>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '400px',
      }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            padding: '1rem',
            fontSize: '1.2rem',
            backgroundColor: '#000000',
            color: '#ffffff',
            border: '2px solid #ffffff',
            outline: 'none',
            fontFamily: 'Arial, sans-serif',
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: '1rem',
            fontSize: '1.2rem',
            backgroundColor: '#000000',
            color: '#ffffff',
            border: '2px solid #ffffff',
            outline: 'none',
            fontFamily: 'Arial, sans-serif',
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            padding: '1rem',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            backgroundColor: '#000000',
            color: '#ffffff',
            border: '2px solid #ffffff',
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff'
            e.currentTarget.style.color = '#000000'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#000000'
            e.currentTarget.style.color = '#ffffff'
          }}
        >
          Login
        </button>
      </div>
    </div>
  )
}

