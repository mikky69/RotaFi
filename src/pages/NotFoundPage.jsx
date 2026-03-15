import React from 'react';
import { Link } from 'react-router-dom';
import { T, sans } from '../theme.js';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh', background: T.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 32, fontFamily: sans,
    }}>
      <div style={{ textAlign: 'center', animation: 'fadeUp .3s ease both' }}>
        <div style={{
          fontFamily: "'Sora',sans-serif", fontSize: 80, fontWeight: 700,
          color: T.pinkD, lineHeight: 1, marginBottom: 16,
        }}>
          404
        </div>
        <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:24, fontWeight:700, color:T.text, marginBottom:10 }}>
          Page not found
        </h1>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 32 }}>
          This circle or page doesn't exist.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <Link to="/app" style={{
            background: T.pink, color: '#fff', borderRadius: 8,
            padding: '10px 22px', fontSize: 14, fontWeight: 600,
            textDecoration: 'none', transition: 'background .15s',
          }}>
            Go to overview
          </Link>
          <Link to="/" style={{
            background: 'none', color: T.muted, borderRadius: 8,
            padding: '10px 22px', fontSize: 14,
            border: `1px solid ${T.border}`, textDecoration: 'none',
            transition: 'all .15s',
          }}>
            Home page
          </Link>
        </div>
      </div>
    </div>
  );
}
