import React, { useEffect, useState } from 'react';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine styles based on scroll state
  // Added backdrop-blur for glass effect
  const navBackgroundClass = isScrolled 
    ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50' 
    : 'bg-transparent';

  const billLayneClass = isScrolled 
    ? 'text-slate-900' 
    : 'text-white';

  const insuranceClass = isScrolled 
    ? 'text-primary-600' 
    : 'text-accent-400';

  const taglineClass = isScrolled 
    ? 'text-slate-400' 
    : 'text-indigo-200';

  const navLinkClass = isScrolled
    ? 'text-slate-600 hover:text-primary-600'
    : 'text-white/90 hover:text-accent-400';

  // If we are on a white page (like Admin or Client view), force scrolled look for readability
  // unless we are at top of Landing page
  const isLanding = location.pathname === '/';
  const forceDarkText = !isLanding && !isScrolled;

  const actualBillLayneClass = forceDarkText ? 'text-slate-900' : billLayneClass;
  const actualInsuranceClass = forceDarkText ? 'text-primary-600' : insuranceClass;
  const actualTaglineClass = forceDarkText ? 'text-slate-500' : taglineClass;
  const actualNavClass = forceDarkText ? 'text-slate-600 hover:text-primary-600' : navLinkClass;
  const actualBgClass = !isLanding && !isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200' : navBackgroundClass;

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${actualBgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section - Links to External Website */}
          <a href="https://www.billlayneinsurance.com" className="flex items-center space-x-3 group">
            <div className={`p-2 rounded-xl shadow-sm transition-all duration-300 ${isScrolled || forceDarkText ? 'bg-primary-600 text-white shadow-primary-600/20' : 'bg-white/10 text-accent-400 backdrop-blur-sm'}`}>
              <ShieldCheck size={28} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <div className="leading-none text-2xl tracking-tight">
                <span className={`font-display font-extrabold transition-colors duration-300 ${actualBillLayneClass}`}>
                  Bill Layne
                </span>
                <span className={`font-display font-extrabold ml-1 transition-colors duration-300 ${actualInsuranceClass}`}>
                  Insurance
                </span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-1 transition-colors duration-300 ${actualTaglineClass}`}>
                Elkin's Trusted Agency
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/" className={`text-sm font-bold transition-colors ${actualNavClass}`}>Home</Link>
            <Link to="/admin" className={`text-sm font-bold transition-colors ${actualNavClass}`}>Agent Portal</Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-md ${isScrolled || forceDarkText ? 'text-slate-900' : 'text-white'}`}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-xl absolute w-full px-4 pt-2 pb-6 flex flex-col space-y-3 animate-in slide-in-from-top-2">
          <Link 
            to="/" 
            className="text-slate-900 font-bold py-3 px-2 block hover:bg-slate-50 rounded-lg"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            to="/admin" 
            className="text-primary-600 font-bold py-3 px-2 block hover:bg-primary-50 rounded-lg"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Agent Portal
          </Link>
          <a 
            href="https://www.billlayneinsurance.com"
            className="text-slate-500 font-bold py-3 px-2 block border-t border-slate-100 mt-2 pt-4"
          >
            Visit Main Website
          </a>
        </div>
      )}
    </nav>
  );
};

export default Header;