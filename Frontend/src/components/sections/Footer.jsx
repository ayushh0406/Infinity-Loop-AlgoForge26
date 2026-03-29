import { Link } from 'react-router-dom';
import { Linkedin, Twitter } from 'lucide-react';
import Badge from '../ui/Badge';

/**
 * Footer Component
 */

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#020817] border-t border-[rgba(255,255,255,0.06)]">
      <div className="container py-16">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Left - Logo & Tagline */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <span className="font-display font-bold text-xl text-white">
                Trust<span className="text-[#4F8EF7]">.</span>Pool
              </span>
            </Link>
            <p className="text-white/40 text-sm mb-6">
              Credit for the uncredited.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-white/40 hover:text-white hover:border-[rgba(79,142,247,0.3)] transition-all"
              >
                <Linkedin size={16} />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-white/40 hover:text-white hover:border-[rgba(79,142,247,0.3)] transition-all"
              >
                <Twitter size={16} />
              </a>
            </div>
          </div>

          {/* Center - Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-4">
                Product
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/score" className="text-white/40 hover:text-white text-sm transition-colors">
                    Score
                  </Link>
                </li>
                <li>
                  <Link to="/pool" className="text-white/40 hover:text-white text-sm transition-colors">
                    Pool
                  </Link>
                </li>
                <li>
                  <Link to="/ledger" className="text-white/40 hover:text-white text-sm transition-colors">
                    Ledger
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-4">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Right - Badge */}
          <div className="flex flex-col items-start md:items-end">
            <Badge variant="glass" size="lg" className="mb-4">
              Built at Hackathon 2025
            </Badge>
            <p className="text-white/20 text-xs font-mono">
              Powered by UPI · SHAP · SHA-256
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[rgba(255,255,255,0.06)] mt-12 pt-6">
          <p className="text-white/30 text-sm text-center">
            © {currentYear} TrustPool AI · Made in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
