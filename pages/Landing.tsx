import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Shield, FileCheck, ArrowRight, Smartphone, X, Link as LinkIcon, Search, ChevronRight } from 'lucide-react';

const Landing: React.FC = () => {
  const [showClientModal, setShowClientModal] = useState(false);
  const [manualLink, setManualLink] = useState('');
  const navigate = useNavigate();

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLink) return;

    try {
      // Extract the 'data' parameter from a full URL or just use the string if it looks like a hash
      let hash = manualLink.trim();
      
      // If user pasted a full URL
      if (hash.includes('data=')) {
        const urlObj = new URL(hash);
        // Handle hash router style (e.g. /#/upload?data=...) or query param style
        if (hash.includes('#/upload')) {
            const parts = hash.split('data=');
            if (parts.length > 1) {
                hash = parts[1].split('&')[0];
            }
        } else {
            hash = urlObj.searchParams.get('data') || hash;
        }
      }

      // Clean up potential quotes
      hash = hash.replace(/['"]/g, '');

      if (hash) {
        navigate(`/upload?data=${hash}`);
      } else {
        alert("Could not find a valid code in that link. Please try again.");
      }
    } catch (err) {
      // Fallback simple extraction
      if (manualLink.includes('data=')) {
        const hash = manualLink.split('data=')[1].split('&')[0];
        navigate(`/upload?data=${hash}`);
      } else {
        alert("Invalid link format.");
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-900 selection:bg-accent-400 selection:text-slate-900">
      {/* Hero Section */}
      <div className="relative flex-grow flex items-center justify-center pt-20 overflow-hidden">
        
        {/* Technical Grid Background */}
        <div className="absolute inset-0 z-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* Abstract Glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary-600/30 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-accent-400/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-wide mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-accent-400 mr-2 animate-pulse"></span>
            Official Document Portal
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 drop-shadow-xl font-display">
            Simplified Underwriting. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-amber-200 to-accent-400 bg-300% animate-gradient">
              Instant Photo Collection.
            </span>
          </h1>
          
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-300 mb-12 leading-relaxed font-light">
            Securely upload your property photos and documents directly to Bill Layne Insurance. No app downloads required.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-20">
            {/* Agent Button */}
            <Link 
              to="/admin" 
              className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-300 bg-slate-800 border border-slate-700 rounded-full hover:bg-slate-700 hover:border-slate-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-900"
            >
              <Shield className="mr-2 h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
              I'm an Agent
            </Link>
            
            {/* Client Button (Primary) */}
            <button 
              onClick={() => setShowClientModal(true)}
              className="group relative inline-flex items-center justify-center px-10 py-4 text-base font-bold text-slate-900 transition-all duration-300 bg-accent-400 rounded-full hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-400 focus:ring-offset-slate-900"
            >
              <Camera className="mr-2 h-5 w-5 text-slate-900" />
              I'm a Client
              <ChevronRight className="ml-1 h-4 w-4 opacity-50 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors group">
              <div className="h-14 w-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-accent-400 group-hover:scale-110 transition-transform duration-300 border border-slate-700">
                <Smartphone size={28} />
              </div>
              <h3 className="text-white text-xl font-bold mb-3 font-display">Mobile Optimized</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Works perfectly on any smartphone. Take photos directly from your browser with zero friction.</p>
            </div>
            
            <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <FileCheck size={100} className="text-white transform rotate-12 translate-x-4 -translate-y-4" />
              </div>
              <div className="h-14 w-14 bg-primary-600 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary-600/30">
                <FileCheck size={28} />
              </div>
              <h3 className="text-white text-xl font-bold mb-3 font-display">AI Verification</h3>
              <p className="text-slate-300 text-sm leading-relaxed">Powered by Gemini AI to ensure your photos meet underwriting standards instantly.</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors group">
              <div className="h-14 w-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform duration-300 border border-slate-700">
                <Shield size={28} />
              </div>
              <h3 className="text-white text-xl font-bold mb-3 font-display">Secure Transfer</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Direct, bank-level encrypted connection to your agent. Your data never stays on public servers.</p>
            </div>
          </div>

        </div>
      </div>

      {/* Client Access Modal */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 border border-white/20">
            <button 
              onClick={() => setShowClientModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors bg-slate-100 rounded-full p-2"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <Smartphone size={40} className="text-primary-600" />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-3 font-display">Access Your Portal</h2>
              <p className="text-slate-500 leading-relaxed">
                For your security, please use the <strong className="text-slate-900">One-Click Link</strong> sent to your email or text message.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
               <h3 className="text-sm font-bold text-slate-900 uppercase mb-3 flex items-center tracking-wide">
                  <div className="w-1 h-4 bg-accent-400 rounded-full mr-2"></div> 
                  How it works
               </h3>
               <ol className="text-sm text-slate-600 space-y-3">
                 <li className="flex items-start">
                    <span className="font-bold text-slate-400 mr-2">1.</span>
                    Check your inbox for a message from Bill Layne Insurance.
                 </li>
                 <li className="flex items-start">
                    <span className="font-bold text-slate-400 mr-2">2.</span>
                    Click the "Upload Photos" link.
                 </li>
                 <li className="flex items-start">
                    <span className="font-bold text-slate-400 mr-2">3.</span>
                    The portal will open automatically—no password needed!
                 </li>
               </ol>
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="bg-white px-3 text-slate-400 font-bold">Or paste link manually</span>
                </div>
            </div>

            <form onSubmit={handleManualSubmit} className="mt-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={manualLink}
                  onChange={(e) => setManualLink(e.target.value)}
                  placeholder="Paste your link here..."
                  className="flex-grow rounded-xl border-slate-300 text-sm py-3 px-4 focus:border-primary-500 focus:ring-primary-500 bg-slate-50 focus:bg-white transition-colors"
                />
                <button 
                  type="submit"
                  className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center shadow-lg shadow-slate-900/20"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;