import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Hero from '../components/sections/Hero';
import ProblemMarquee from '../components/sections/ProblemMarquee';
import HowItWorks from '../components/sections/HowItWorks';
import StatsSection from '../components/sections/StatsSection';
import ComparisonTable from '../components/sections/ComparisonTable';
import Footer from '../components/sections/Footer';

/**
 * Landing Page
 * The main marketing page for TrustPool AI
 */

export default function Landing() {
  const navigate = useNavigate();
  const { isAuth, loading } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && isAuth) {
      navigate('/dashboard');
    }
  }, [isAuth, loading, navigate]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero Section */}
      <Hero />
      
      {/* Problem Marquee */}
      <ProblemMarquee />
      
      {/* How It Works */}
      <HowItWorks />
      
      {/* Stats Counter Section */}
      <StatsSection />
      
      {/* Comparison Table */}
      <ComparisonTable />
      
      {/* Footer */}
      <Footer />
    </motion.main>
  );
}
