import React from 'react';

interface FooterProps {
  phone?: string;
  email?: string;
  year?: number;
}

const Footer: React.FC<FooterProps> = ({ 
  phone = "+91 98XXXXXX90", 
  email = "casa234@gmail.com", 
  year = new Date().getFullYear() 
}) => {
  return (
    <footer className="mx-4 mt-6 mb-24 rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-950/80 p-6 shadow-lg backdrop-blur">
      {/* Simple Brand Section */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mr-2">
            CASA
          </span>
          <span className="text-xl font-bold text-white">App</span>
        </div>
        <p className="text-sm text-slate-300">Style. Swipe. Shop.</p>
      </div>

      {/* Simple Contact Info */}
      <div className="text-center mb-6">
        <p className="text-sm text-slate-300 mb-1">{phone}</p>
        <p className="text-sm text-slate-300">{email}</p>
      </div>

      {/* Simple Copyright */}
      <div className="text-center">
        <p className="text-xs text-slate-400">
          © {year} CASA App. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;