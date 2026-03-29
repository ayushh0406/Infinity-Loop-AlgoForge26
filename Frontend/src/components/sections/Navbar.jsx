import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

/**
 * Navbar Component
 * Fixed, blur backdrop, shrinks on scroll
 */

const navLinks = [
  { label: 'Score', href: '/score' },
  { label: 'Pool', href: '/pool' },
  { label: 'Ledger', href: '/ledger' }
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuth, user, logout } = useAuth();
  
  const { scrollY } = useScroll();
  const height = useTransform(scrollY, [0, 100], [64, 52]);
  const background = useTransform(
    scrollY,
    [0, 50],
    ['rgba(2,8,23,0.60)', 'rgba(2,8,23,0.90)']
  );

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Hide navbar on login page
  if (location.pathname === '/login' || location.pathname === '/lender-login') {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-[24px] border-b border-[rgba(255,255,255,0.06)]"
        style={{ height, backgroundColor: background }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="container h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="font-display font-bold text-xl text-white">
              Trust<span className="text-[#4F8EF7]">.</span>Pool
            </span>
          </Link>

          {/* Desktop Navigation */}
          {/* {isAuth && (
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`
                    text-sm font-medium transition-colors duration-200
                    ${location.pathname === link.href 
                      ? 'text-white' 
                      : 'text-white/60 hover:text-white'}
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )} */}

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {isAuth ? (
              <>
                <div className="flex items-center gap-2">
                  {/* <div className="text-sm text-gray-400">
                    {user?.name}
                  </div> */}
                  {/* User Role Badge */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#4F8EF7]/20 to-[#9333EA]/20 border border-[#4F8EF7]/30 text-[#4F8EF7]">
                    <span>{user?.role === 'lender' ? '🏦' : '👤'}</span>
                    <span>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</span>
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white/80 hover:text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Drawer */}
            <motion.div
              className="absolute top-[64px] left-0 right-0 bg-[#060F24] border-b border-[rgba(255,255,255,0.08)] p-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col gap-4">
                {isAuth && (
                  <>
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className={`
                          text-lg font-medium py-2 transition-colors
                          ${location.pathname === link.href 
                            ? 'text-white' 
                            : 'text-white/60'}
                        `}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <hr className="border-[rgba(255,255,255,0.08)] my-2" />
                    <div className="text-sm text-gray-400 py-2 flex items-center gap-2">
                      {user?.name}
                        {/* Mobile User Role Badge */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#4F8EF7]/20 to-[#9333EA]/20 border border-[#4F8EF7]/30 text-[#4F8EF7]">
                          <span>{user?.role === 'lender' ? '🏦' : '👤'}</span>
                          <span>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</span>
                        </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors py-2"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </>
                )}
                {!isAuth && (
                  <>
                    <Link to="/login" className="w-full">
                      <Button variant="secondary" fullWidth>
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/login" className="w-full">
                      <Button fullWidth>
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
