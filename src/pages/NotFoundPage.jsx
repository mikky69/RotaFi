import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8 font-sans">
      <div className="text-center" style={{ animation: 'fadeUp .3s ease both' }}>
        <div className="font-sora text-[80px] font-bold text-pink-d leading-none mb-4">404</div>
        <h1 className="font-sora text-2xl font-bold text-ink mb-2.5">Page not found</h1>
        <p className="text-muted text-sm mb-8">This circle or page doesn't exist.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/app" className="bg-pink text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-pink-l transition-colors">
            Go to overview
          </Link>
          <Link to="/" className="text-muted rounded-lg px-5 py-2.5 text-sm border border-border hover:bg-card transition-colors">
            Home page
          </Link>
        </div>
      </div>
    </div>
  );
}
