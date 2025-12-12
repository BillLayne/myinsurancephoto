import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { decodeRequestData } from '../services/urlService';
import { analyzeImage } from '../services/geminiService';
import { uploadPhotosToDrive } from '../services/uploadService';
import { ClientUploadRequest, UploadedFile, PhotoStatus } from '../types';
import { Camera, Check, AlertCircle, Loader2, ChevronRight, MapPin, Lightbulb, Scan, Maximize, XCircle, ImageIcon, Thermometer, Droplets, Home, Phone, Mail, ShieldCheck } from 'lucide-react';

// --- CONFIGURATION: PASTE YOUR IMAGE LINKS HERE ---
const EXAMPLE_IMAGES = {
  HOUSE_EXTERIOR: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80",
  ELECTRICAL_PANEL: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
  PLUMBING_SINK: "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
  ROOF: "https://plus.unsplash.com/premium_photo-1661876490656-963c6310df62?auto=format&fit=crop&w=800&q=80",
  HVAC: "https://plus.unsplash.com/premium_photo-1663090819777-6286df9c5365?auto=format&fit=crop&w=800&q=80", 
  WATER_HEATER: "https://images.unsplash.com/photo-1585233221943-7e4529367207?auto=format&fit=crop&w=800&q=80",
  POOL: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80"
};

const ClientUpload: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<ClientUploadRequest | null>(null);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmationId, setConfirmationId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Parse URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hash = params.get('data');
    if (hash) {
      const decoded = decodeRequestData(hash);
      if (decoded) {
        setData(decoded);
      } else {
        alert("Invalid Link");
        navigate('/');
      }
    } else {
      navigate('/');
    }
    setIsLoading(false);
  }, [location, navigate]);

  const handleFileUpload = async (requirementId: string, label: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create local preview
    const previewUrl = URL.createObjectURL(file);
    
    // Optimistic update
    const newUpload: UploadedFile = {
      requirementId,
      file,
      previewUrl,
      status: PhotoStatus.ANALYZING
    };

    setUploads(prev => {
        const filtered = prev.filter(u => u.requirementId !== requirementId);
        return [...filtered, newUpload];
    });

    // Call Gemini AI
    try {
      const analysis = await analyzeImage(file, label);
      
      setUploads(prev => prev.map(u => {
        if (u.requirementId === requirementId) {
          return {
            ...u,
            status: analysis.isValid ? PhotoStatus.VERIFIED : PhotoStatus.REJECTED,
            aiFeedback: analysis.feedback
          };
        }
        return u;
      }));

    } catch (err) {
      setUploads(prev => prev.map(u => {
        if (u.requirementId === requirementId) {
          return { ...u, status: PhotoStatus.PENDING, aiFeedback: "AI check failed, manual review needed." };
        }
        return u;
      }));
    }
  };

  const handleSubmit = async () => {
    if (!data) return;
    setIsSubmitting(true);
    setErrorMsg('');
    
    const uniqueId = 'BLI-' + Math.random().toString(36).substr(2, 6).toUpperCase() + '-' + Date.now().toString().slice(-4);
    const result = await uploadPhotosToDrive(data, uploads, uniqueId);

    if (result.success) {
        setConfirmationId(uniqueId);
        setIsSuccess(true);
    } else {
        console.error(result.error);
        if (result.error && result.error.includes("URL not set")) {
             setErrorMsg("System Error: The upload connection is not configured. Please contact the agency.");
        } else {
             setErrorMsg("Upload failed. Please check your internet connection and try again.");
        }
    }
    
    setIsSubmitting(false);
  };

  const getUploadForReq = (reqId: string) => uploads.find(u => u.requirementId === reqId);

  const getPhotoGuidance = (label: string) => {
    const l = label.toLowerCase();
    
    if (l.match(/front|back|side|house|elevation|exterior/)) {
        return {
            tip: "Stand back at least 20 feet. Fit the ground AND the roof in the frame.",
            icon: <Home size={18} />,
            exampleText: "Show the whole house, not just a window.",
            exampleUrl: EXAMPLE_IMAGES.HOUSE_EXTERIOR
        };
    }
    if (l.match(/panel|electric|breaker|fuse/)) {
        return {
            tip: "Open the metal door first. Ensure the breaker labels are legible.",
            icon: <Scan size={18} />,
            exampleText: "Avoid glare/flash on the labels.",
            exampleUrl: EXAMPLE_IMAGES.ELECTRICAL_PANEL
        };
    }
    if (l.match(/sink|plumbing|pipe/)) {
        return {
            tip: "Open the cabinet doors completely. We need to see the pipes underneath.",
            icon: <Droplets size={18} />,
            exampleText: "Use flash to light up the dark cabinet.",
            exampleUrl: EXAMPLE_IMAGES.PLUMBING_SINK
        };
    }
    if (l.match(/roof|shingle/)) {
        return {
            tip: "Step back far enough to see the shingles/surface clearly.",
            icon: <Maximize size={18} />,
            exampleText: "Don't climb a ladder. Ground view is fine.",
            exampleUrl: EXAMPLE_IMAGES.ROOF
        };
    }
    if (l.match(/hvac|ac unit|furnace|air condition/)) {
        return {
            tip: "Find the manufacturer sticker (data plate) on the side of the unit.",
            icon: <Thermometer size={18} />,
            exampleText: "Make sure the Serial Number is readable.",
            exampleUrl: EXAMPLE_IMAGES.HVAC
        };
    }
    if (l.match(/water heater|tank/)) {
        return {
            tip: "Take a full vertical shot of the tank. Include the pipe connections at the top.",
            icon: <Thermometer size={18} />,
            exampleText: "Ensure the area is well lit.",
            exampleUrl: EXAMPLE_IMAGES.WATER_HEATER
        };
    }
    if (l.match(/pool|spa|hot tub/)) {
        return {
            tip: "Capture the pool and the surrounding fence/gates if present.",
            icon: <Maximize size={18} />,
            exampleText: "Show the safety features.",
            exampleUrl: EXAMPLE_IMAGES.POOL
        };
    }

    return {
        tip: "Ensure the area is well-lit and hold your phone steady.",
        icon: <Lightbulb size={18} />,
        exampleText: "Avoid blurry or dark photos.",
        exampleUrl: null
    };
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary-600 h-8 w-8" /></div>;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Confetti Animation Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
             {[...Array(20)].map((_, i) => (
                 <div key={i} className="absolute animate-float" style={{
                     left: `${Math.random() * 100}%`,
                     top: `-10%`,
                     animationDelay: `${Math.random() * 2}s`,
                     animationDuration: `${3 + Math.random() * 4}s`,
                     backgroundColor: ['#fbbf24', '#4f46e5', '#ef4444', '#10b981'][Math.floor(Math.random() * 4)],
                     width: '10px',
                     height: '10px',
                     borderRadius: '50%'
                 }}></div>
             ))}
        </div>

        <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-2xl text-center border-t-4 border-accent-400 relative z-10 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-green-200 shadow-lg">
            <Check size={48} className="text-green-600 animate-bounce" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-2 font-display">Success!</h2>
          <p className="text-slate-600 mb-8 text-lg">
            Thank you, <strong>{data?.clientName}</strong>. Your photos have been securely received.
          </p>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Confirmation Number</p>
            <p className="text-3xl font-mono font-bold text-primary-600 select-all tracking-tight">{confirmationId}</p>
            <p className="text-[10px] text-slate-400 mt-2">Please save this number for your records.</p>
          </div>

          <button onClick={() => window.location.reload()} className="text-slate-500 font-bold hover:text-primary-600 text-sm transition-colors">
            Upload Additional Photos
          </button>
        </div>
        
        <style>{`
          @keyframes float {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
          }
          .animate-float { animation-name: float; animation-timing-function: linear; animation-iteration-count: infinite; }
        `}</style>
      </div>
    );
  }

  if (!data) return null;

  const progress = Math.round((uploads.filter(u => u.status === PhotoStatus.VERIFIED || u.status === PhotoStatus.PENDING).length / data.requirements.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-accent-200">
      {/* Submission Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-300">
           <div className="relative">
             <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-accent-400 animate-spin mb-8"></div>
             <ShieldCheck className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" size={32} />
           </div>
           
           <h2 className="text-3xl font-extrabold text-white mb-2 font-display">Uploading {uploads.length} Photos</h2>
           <p className="text-xl text-indigo-200 mb-8 max-w-md">Please do not close this window or refresh the page.</p>
           
           <div className="bg-white/10 rounded-lg p-4 max-w-sm w-full border border-white/10">
              <div className="flex items-center text-sm text-slate-300">
                <Loader2 size={16} className="animate-spin mr-3 text-accent-400" />
                <span>Sending securely to Bill Layne Insurance...</span>
              </div>
           </div>
           <p className="text-slate-500 text-sm mt-8">Do not leave until you see a confirmation number.</p>
        </div>
      )}

      {/* Header Spacing */}
      <div className="pt-24 pb-32 px-4">
      <div className="max-w-xl mx-auto">
        
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-accent-400"></div>
          <div className="flex justify-between items-start mb-4">
             <div>
                <h1 className="text-2xl font-extrabold text-slate-900 font-display">Photo Request</h1>
                <p className="text-slate-600 font-medium">For: <span className="font-bold text-slate-900">{data.clientName}</span></p>
             </div>
             {data.insuranceCompany && (
                 <div className="text-right">
                     <span className="text-primary-600 text-[10px] font-extrabold uppercase bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                         {data.insuranceCompany}
                     </span>
                 </div>
             )}
          </div>

          {data.address && (
            <p className="text-slate-500 text-sm flex items-center mb-6">
                <MapPin size={16} className="mr-2 text-slate-400" /> {data.address}
            </p>
          )}

          {/* Contact Support Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <a 
                href="tel:3368351993"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold border border-slate-200 transition-colors"
            >
                <Phone size={16} className="text-primary-600" />
                Call Agency
            </a>
            <a 
                href="mailto:Save@billlayneinsurance.com?subject=Help with Photos"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold border border-slate-200 transition-colors"
            >
                <Mail size={16} className="text-primary-600" />
                Email Help
            </a>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-xs font-bold uppercase text-slate-400 mb-1">
              <span>Completion</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className="bg-gradient-to-r from-accent-400 to-amber-300 h-3 rounded-full transition-all duration-700 ease-out shadow-sm" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold flex items-center shadow-sm">
                <AlertCircle className="mr-2" />
                {errorMsg}
            </div>
        )}

        {/* Requirements List */}
        <div className="space-y-8">
          {data.requirements.map((req) => {
            const upload = getUploadForReq(req.id);
            const guidance = getPhotoGuidance(req.label);

            return (
              <div key={req.id} className={`relative bg-white rounded-2xl shadow-sm border transition-all duration-300 ${upload?.status === PhotoStatus.VERIFIED ? 'border-green-500 ring-1 ring-green-100' : upload?.status === PhotoStatus.REJECTED ? 'border-red-400 ring-1 ring-red-100' : 'border-slate-100 hover:shadow-md'}`}>
                
                {/* Enhanced Status Indicator Strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl transition-colors duration-300 ${
                    upload && upload.status === PhotoStatus.ANALYZING ? 'bg-accent-400' :
                    upload && upload.status === PhotoStatus.VERIFIED ? 'bg-green-500' :
                    upload && upload.status === PhotoStatus.REJECTED ? 'bg-red-500' : 
                    req.isMandatory ? 'bg-slate-300' : 'bg-slate-200'
                }`}></div>

                <div className="p-6 pl-8">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center font-display">
                            {req.label}
                            {req.isMandatory && !upload && <span className="ml-2 text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full uppercase border border-red-100">Required</span>}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">{req.description}</p>
                    </div>
                    {/* Status Icons */}
                    {upload?.status === PhotoStatus.VERIFIED && <div className="bg-green-100 text-green-700 p-1.5 rounded-full"><Check size={16} strokeWidth={3} /></div>}
                  </div>

                  {/* Expert Tip Section (Only show if not uploaded yet) */}
                  {!upload && (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 my-5">
                        <div className="flex items-start gap-3">
                            <div className="bg-white text-primary-600 p-2 rounded-lg mt-0.5 shrink-0 shadow-sm border border-slate-100">
                                {guidance.icon}
                            </div>
                            <div className="flex-grow">
                                <p className="text-xs font-bold text-primary-900 uppercase mb-0.5 tracking-wide">Helpful Tip</p>
                                <p className="text-sm text-slate-700 leading-snug">{guidance.tip}</p>
                            </div>
                        </div>

                        {/* Reference Image or Fallback Icon */}
                        <div className="mt-4">
                            {guidance.exampleUrl ? (
                                <div className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm w-full h-32 bg-slate-100">
                                    <img 
                                        src={guidance.exampleUrl} 
                                        alt="Example requirement" 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-3">
                                        <span className="text-white text-xs font-bold flex items-center">
                                            <ImageIcon size={12} className="mr-1.5 opacity-80" /> Example Photo
                                        </span>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                  )}
                  
                  {/* Feedback Area */}
                  {upload?.status === PhotoStatus.ANALYZING && (
                    <div className="flex items-center text-sm text-accent-700 font-bold bg-amber-50 p-3 rounded-lg mb-4 border border-amber-100 animate-pulse">
                      <Loader2 size={16} className="animate-spin mr-2" /> AI is verifying photo quality...
                    </div>
                  )}
                  {upload?.status === PhotoStatus.VERIFIED && (
                    <div className="flex items-center text-sm text-green-700 font-bold bg-green-50 p-3 rounded-lg mb-4 border border-green-100">
                      <Check size={16} className="mr-2" /> {upload.aiFeedback || "Verified. Looks great!"}
                    </div>
                  )}
                  {upload?.status === PhotoStatus.REJECTED && (
                    <div className="flex items-start text-sm text-red-700 font-bold bg-red-50 p-3 rounded-lg mb-4 border border-red-100">
                      <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" /> 
                      <span>{upload.aiFeedback || "Please retake the photo."}</span>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="mt-2">
                    <input
                      type="file"
                      id={`file-${req.id}`}
                      accept="image/*"
                      capture="environment" // Forces rear camera on mobile
                      className="hidden"
                      onChange={(e) => handleFileUpload(req.id, req.label, e)}
                    />
                    
                    {upload ? (
                      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                         <div className="flex items-center">
                             <img src={upload.previewUrl} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-slate-100 mr-3" />
                             <div>
                                <span className="text-xs font-bold text-slate-900 block">Photo Captured</span>
                                <span className="text-[10px] text-slate-400">{(upload.file.size / 1024 / 1024).toFixed(2)} MB</span>
                             </div>
                         </div>
                         <label 
                          htmlFor={`file-${req.id}`}
                          className="text-sm font-bold text-slate-600 px-4 py-2 cursor-pointer hover:bg-slate-50 hover:text-primary-600 rounded-lg transition-all"
                         >
                           Retake
                         </label>
                      </div>
                    ) : (
                      <label 
                        htmlFor={`file-${req.id}`}
                        className="w-full flex items-center justify-center py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-200 active:scale-95 transition-all cursor-pointer hover:bg-slate-800 hover:shadow-xl group"
                      >
                        <Camera className="mr-2 group-hover:rotate-12 transition-transform" size={20} />
                        Take Photo
                      </label>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {/* Sticky Glass Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-200">
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || uploads.length === 0}
            className="w-full shadow-xl shadow-primary-900/20 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-lg py-4 rounded-2xl flex items-center justify-center transition-all transform active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2" /> Submitting...
              </>
            ) : (
              <>
                Submit Photos <ChevronRight className="ml-2" />
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default ClientUpload;