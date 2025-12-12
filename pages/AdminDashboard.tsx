import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Link as LinkIcon, Copy, CheckCircle, HelpCircle, Key, ExternalLink, Sparkles, FileText, Smartphone, Mail, Loader2, Send, Lock, ShieldCheck, ArrowRight, Building, Server, AlertTriangle } from 'lucide-react';
import { PhotoRequirement, ClientUploadRequest } from '../types';
import { encodeRequestData } from '../services/urlService';
import { parsePolicyDocument } from '../services/geminiService';
import { generateEmailTemplate } from '../services/emailTemplate';
import { GOOGLE_SCRIPT_URL } from '../services/uploadService';

const DEFAULT_REQUIREMENTS = [
  { id: '1', label: 'Front of House', description: 'Clear view of the entire front elevation.', isMandatory: true },
  { id: '2', label: 'Back of House', description: 'Clear view of the rear elevation.', isMandatory: true },
  { id: '3', label: 'Side of House (Left)', description: 'Full view of the left side.', isMandatory: true },
  { id: '4', label: 'Side of House (Right)', description: 'Full view of the right side.', isMandatory: true },
  { id: '5', label: 'Electrical Panel', description: 'Open door showing breakers and labels.', isMandatory: true },
  { id: '6', label: 'Roof Condition', description: 'View of roof surface from ground level.', isMandatory: false },
  { id: '7', label: 'HVAC Unit', description: 'Photo of the serial number tag on the unit.', isMandatory: false },
  { id: '8', label: 'Hot Water Heater', description: 'Full view of the water heater.', isMandatory: false },
  { id: '9', label: 'Under Kitchen Sink', description: 'Show plumbing connections.', isMandatory: false },
  { id: '10', label: 'Under Bathroom Sink', description: 'Show plumbing connections.', isMandatory: false },
  { id: '11', label: 'Outbuilding', description: 'Photo of shed or detached garage.', isMandatory: false },
  { id: '12', label: 'Pool', description: 'View of pool and fencing/gates.', isMandatory: false },
];

const CARRIERS = [
  "Nationwide",
  "National General",
  "Progressive",
  "Travelers",
  "NC Grange Mutual",
  "Alamance Farmers",
  "Foremost",
  "NCJUA",
  "Other"
];

const AdminDashboard: React.FC = () => {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState(false);

  const [hasApiKey, setHasApiKey] = useState(false);
  
  // Form Data
  const [clientName, setClientName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [address, setAddress] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  
  // Carrier Data
  const [selectedCarrier, setSelectedCarrier] = useState(CARRIERS[0]);
  const [customCarrier, setCustomCarrier] = useState('');

  // Start with EMPTY requirements
  const [requirements, setRequirements] = useState<PhotoRequirement[]>([]);

  // UI State
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  
  // Auto-Fill State
  const [autoFillText, setAutoFillText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAutoFill, setShowAutoFill] = useState(false);

  // System Checks
  const isBackendConfigured = !GOOGLE_SCRIPT_URL.includes("INSERT_YOUR");

  useEffect(() => {
    // Check for cached authentication
    const cachedAuth = localStorage.getItem('adminAuth');
    if (cachedAuth === 'true') {
      setIsAuthenticated(true);
      checkApiKey();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === '1283') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
      setAuthError(false);
      checkApiKey();
    } else {
      setAuthError(true);
    }
  };

  const checkApiKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && aistudio.hasSelectedApiKey) {
      const hasKey = await aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    }
  };

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && aistudio.openSelectKey) {
      await aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  // --- Auto Fill Logic ---
  const handleAutoFill = async (file?: File) => {
    if (!hasApiKey) {
        alert("Please connect AI API Key first using the button at the top.");
        return;
    }

    setIsAnalyzing(true);
    try {
        const input = file || autoFillText;
        if (!input) {
             alert("Please enter text or upload a PDF/Image.");
             setIsAnalyzing(false);
             return;
        }

        const result = await parsePolicyDocument(input);
        
        if (result.clientName) setClientName(result.clientName);
        if (result.policyNumber) setPolicyNumber(result.policyNumber);
        if (result.address) setAddress(result.address);
        if (result.clientEmail) setClientEmail(result.clientEmail);
        if (result.clientPhone) setClientPhone(result.clientPhone);
        
        if (result.requirements && result.requirements.length > 0) {
            const formattedReqs = result.requirements.map((r, i) => ({
                ...r,
                id: `auto_${Date.now()}_${i}`
            }));
            setRequirements(formattedReqs);
        }

        setShowAutoFill(false);
        setAutoFillText('');
    } catch (error) {
        console.error("Auto-fill error:", error);
        alert("Failed to analyze document. Please ensure the API key is active and the file is a valid PDF or Image.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        handleAutoFill(e.target.files[0]);
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    }
  };

  // --- Requirement Management ---
  const addRequirement = () => {
    const newReq: PhotoRequirement = {
      id: `req_${Date.now()}`,
      label: '',
      description: '',
      isMandatory: true
    };
    setRequirements([...requirements, newReq]);
  };

  const removeRequirement = (id: string) => {
    setRequirements(requirements.filter(r => r.id !== id));
  };

  const updateRequirement = (id: string, field: keyof PhotoRequirement, value: any) => {
    setRequirements(requirements.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const loadPreset = (presetLabel: string) => {
    const preset = DEFAULT_REQUIREMENTS.find(r => r.label === presetLabel);
    if (preset) {
        const newReq = { ...preset, id: `req_${Date.now()}_${Math.random()}` };
        setRequirements([...requirements, newReq]);
    }
  };

  // --- Link Generation & Sharing ---
  const getFinalCarrierName = () => {
      return selectedCarrier === 'Other' ? customCarrier : selectedCarrier;
  };

  const generateLink = () => {
    if (!clientName) {
      alert("Please enter a client name.");
      return;
    }

    if (requirements.length === 0) {
        alert("Please add at least one photo requirement.");
        return;
    }

    const carrier = getFinalCarrierName();

    // We do NOT store PII (Email/Phone) in the encoded link for security
    const requestData: ClientUploadRequest = {
      clientName,
      policyNumber,
      insuranceCompany: carrier,
      address,
      requirements,
      agentEmail: "bill@billlayneinsurance.com"
    };

    const hash = encodeRequestData(requestData);
    const baseUrl = window.location.origin + window.location.pathname;
    const fullUrl = `${baseUrl}#/upload?data=${hash}`;
    
    setGeneratedLink(fullUrl);
    setCopied(false);
    setEmailCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyEmailTemplate = () => {
    const carrier = getFinalCarrierName();
    const requestData: ClientUploadRequest = {
        clientName,
        policyNumber,
        insuranceCompany: carrier,
        address,
        requirements,
        agentEmail: "bill@billlayneinsurance.com"
    };
    const html = generateEmailTemplate(requestData, generatedLink);
    
    // Copy HTML to clipboard (Rich text for Gmail)
    const blob = new Blob([html], { type: "text/html" });
    const textBlob = new Blob([html], { type: "text/plain" });
    const data = [new ClipboardItem({ 
        "text/html": blob,
        "text/plain": textBlob 
    })];
    
    navigator.clipboard.write(data).then(() => {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
    });
  };

  const sendSMS = () => {
    const number = clientPhone.replace(/[^\d+]/g, '');
    const carrier = getFinalCarrierName();
    const body = `Hi ${clientName}, please upload your ${carrier} insurance photos here: ${generatedLink}`;
    window.open(`sms:${number}?body=${encodeURIComponent(body)}`);
  };

  const sendEmail = () => {
    const carrier = getFinalCarrierName();
    
    // 1. Generate the HTML Template
    const requestData: ClientUploadRequest = {
        clientName,
        policyNumber,
        insuranceCompany: carrier,
        address,
        requirements,
        agentEmail: "bill@billlayneinsurance.com"
    };
    const html = generateEmailTemplate(requestData, generatedLink);

    // 2. Copy to Clipboard as Rich Text (text/html)
    const blob = new Blob([html], { type: "text/html" });
    const textBlob = new Blob([html], { type: "text/plain" });
    const data = [new ClipboardItem({ 
        "text/html": blob,
        "text/plain": textBlob 
    })];

    navigator.clipboard.write(data).then(() => {
        setEmailCopied(true); // Re-using state for visual feedback
        setTimeout(() => setEmailCopied(false), 3000);
        
        // 3. Open Gmail in new tab
        const subject = `Photo Request for ${address || clientName} - ${carrier}`;
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${encodeURIComponent(subject)}`;
        
        alert("HTML Template copied to clipboard! \n\nGmail will now open. Please Paste (Ctrl+V) into the body.");
        window.open(gmailUrl, '_blank');
    }).catch((err) => {
        console.error('Clipboard failed', err);
        alert("Failed to copy template. Please check your browser permissions.");
    });
  };

  // --- Auth Guard Render ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-50 p-4 rounded-full">
              <ShieldCheck className="text-primary-600 h-10 w-10" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2 font-display">Agent Portal</h2>
          <p className="text-center text-slate-500 mb-8">Please enter your access code.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  className={`block w-full pl-10 pr-3 py-3 border ${authError ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  placeholder="Security Code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  autoFocus
                />
              </div>
              {authError && <p className="mt-2 text-xs text-red-600 font-bold">Incorrect code. Please try again.</p>}
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all"
            >
              Access Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main Dashboard Render ---
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 font-display">Agent Dashboard</h1>
            <p className="mt-2 text-slate-500">Create a custom photo request link for your client.</p>
          </div>
          
          <button 
            onClick={() => setShowAutoFill(!showAutoFill)}
            className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Sparkles size={18} className="mr-2" />
            AI Auto-Fill
          </button>
        </div>

        {/* System Status Check */}
        {!isBackendConfigured && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-xl shadow-sm">
             <div className="flex items-start">
               <AlertTriangle className="text-amber-500 mr-3 flex-shrink-0" />
               <div>
                  <h3 className="text-amber-800 font-bold text-sm uppercase tracking-wide">Tiiny.host Backend Not Connected</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    Static hosts like Tiiny.host cannot save files or send emails on their own. You must set up the Google Script.
                  </p>
                  <p className="text-amber-700 text-sm mt-2 font-mono bg-amber-100 p-2 rounded inline-block border border-amber-200">
                    Open services/uploadService.ts and paste your Script URL.
                  </p>
               </div>
             </div>
          </div>
        )}

        {/* AI Studio Key Config */}
        {!hasApiKey && (
           <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                  <div className="flex items-center text-indigo-900 font-bold mb-1">
                      <Key className="mr-2" size={20} />
                      Enable AI Verification & Auto-Fill
                  </div>
                  <p className="text-sm text-indigo-700 mb-2">
                    Connect your Google Cloud project to use Gemini AI features.
                  </p>
              </div>
              <button 
                  onClick={handleSelectKey} 
                  className="whitespace-nowrap bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-colors"
              >
                  Select API Key
              </button>
           </div>
        )}

        {/* Auto Fill Panel */}
        {showAutoFill && (
            <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                        <Sparkles size={18} className="mr-2 text-primary-600" />
                        Auto-Fill from Documents
                    </h3>
                    <button onClick={() => setShowAutoFill(false)} className="text-slate-400 hover:text-slate-600"><Trash2 size={18}/></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary-400 hover:bg-slate-50 transition-colors relative">
                         {isAnalyzing ? (
                             <Loader2 className="animate-spin text-primary-600 mb-2" size={32} />
                         ) : (
                             <FileText className="text-slate-400 mb-2" size={32} />
                         )}
                         <p className="font-bold text-slate-700">Upload Policy / Request PDF</p>
                         <p className="text-xs text-slate-500 mb-4">or Image (JPG, PNG)</p>
                         <input 
                            type="file" 
                            accept=".pdf,image/*" 
                            onChange={handleFileUpload}
                            disabled={isAnalyzing}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                         />
                         <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded font-bold pointer-events-none relative z-10">Select File</span>
                    </div>

                    <div className="flex flex-col">
                        <textarea
                            value={autoFillText}
                            onChange={(e) => setAutoFillText(e.target.value)}
                            placeholder="Or paste underwriting requirements / notes here..."
                            className="flex-grow p-3 border border-slate-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 mb-3"
                            rows={4}
                        />
                        <button 
                            onClick={() => handleAutoFill()}
                            disabled={isAnalyzing || !autoFillText}
                            className="bg-slate-900 text-white py-2 rounded-lg font-bold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Parse Text'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Client Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-600 focus:ring-primary-600 sm:text-sm p-2 border"
                    placeholder="e.g. John Doe"
                  />
                </div>
                
                {/* Insurance Company Field */}
                <div className="md:col-span-1">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Insurance Company</label>
                   <select
                     value={selectedCarrier}
                     onChange={(e) => setSelectedCarrier(e.target.value)}
                     className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-600 focus:ring-primary-600 sm:text-sm p-2 border bg-white"
                   >
                     {CARRIERS.map(c => (
                        <option key={c} value={c}>{c}</option>
                     ))}
                   </select>
                </div>
                
                {/* Custom Insurance Text Box (Conditional) */}
                {selectedCarrier === 'Other' && (
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Enter Company Name</label>
                        <input
                            type="text"
                            value={customCarrier}
                            onChange={(e) => setCustomCarrier(e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-600 focus:ring-primary-600 sm:text-sm p-2 border"
                            placeholder="Type Name Here..."
                            autoFocus
                        />
                    </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Property Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-600 focus:ring-primary-600 sm:text-sm p-2 border"
                    placeholder="e.g. 123 Maple Ave, Elkin, NC"
                  />
                </div>
                
                {/* Contact Fields (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Phone (Optional)</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-600 focus:ring-primary-600 sm:text-sm p-2 border"
                    placeholder="e.g. 555-0123"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-600 focus:ring-primary-600 sm:text-sm p-2 border"
                    placeholder="client@example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Policy Number (Optional)</label>
                  <input
                    type="text"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-600 focus:ring-primary-600 sm:text-sm p-2 border"
                    placeholder="e.g. POL-987654321"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-900">Photo Requirements</h2>
                <button
                  onClick={addRequirement}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none"
                >
                  <Plus size={16} className="mr-1" /> Add Custom
                </button>
              </div>

              {/* Quick Presets */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 font-bold uppercase mb-2">Quick Add:</p>
                <div className="flex flex-wrap gap-2">
                    {DEFAULT_REQUIREMENTS.map(preset => (
                    <button 
                        key={preset.id}
                        onClick={() => loadPreset(preset.label)}
                        className="text-xs bg-slate-50 hover:bg-white text-slate-600 hover:text-primary-600 px-2 py-1.5 rounded border border-slate-200 hover:border-primary-200 hover:shadow-sm transition-all"
                    >
                        + {preset.label}
                    </button>
                    ))}
                </div>
              </div>

              <div className="space-y-4">
                {requirements.length === 0 && (
                    <div className="text-center py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                        <p className="text-sm">No requirements added yet.</p>
                        <p className="text-xs">Click a preset above to start.</p>
                    </div>
                )}
                
                {requirements.map((req, index) => (
                  <div key={req.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group transition-all hover:border-primary-200 hover:bg-white hover:shadow-sm">
                    <button
                      onClick={() => removeRequirement(req.id)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <input
                        type="text"
                        value={req.label}
                        onChange={(e) => updateRequirement(req.id, 'label', e.target.value)}
                        className="block w-full border-0 border-b border-transparent bg-transparent focus:border-primary-600 focus:ring-0 text-sm font-bold text-slate-900 p-0 placeholder-slate-400"
                        placeholder="Requirement Name (e.g. Front of House)"
                      />
                      <input
                        type="text"
                        value={req.description}
                        onChange={(e) => updateRequirement(req.id, 'description', e.target.value)}
                        className="block w-full border-0 bg-transparent focus:ring-0 text-xs text-slate-500 p-0 placeholder-slate-300"
                        placeholder="Instructions for client..."
                      />
                      <div className="flex items-center mt-1">
                        <input
                          type="checkbox"
                          id={`mandatory-${req.id}`}
                          checked={req.isMandatory}
                          onChange={(e) => updateRequirement(req.id, 'isMandatory', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                        />
                        <label htmlFor={`mandatory-${req.id}`} className="ml-2 block text-xs text-slate-700">
                          Mandatory
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={generateLink}
              disabled={!isBackendConfigured}
              className="w-full flex justify-center items-center px-6 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-accent-400 hover:bg-yellow-500 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-accent-400/30 transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-400"
            >
              <LinkIcon className="mr-2" />
              {isBackendConfigured ? "Generate Client Link" : "Connect Backend to Generate"}
            </button>
          </div>

          {/* Right Column: Output (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {generatedLink ? (
              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-primary-100 sticky top-24">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600 mb-4 mx-auto">
                  <CheckCircle size={24} />
                </div>
                <h3 className="text-center text-xl font-bold text-slate-900 mb-1">Link Ready!</h3>
                <p className="text-center text-slate-500 text-sm mb-6">
                   Secure link created for <strong>{clientName}</strong>.
                </p>
                
                <div className="bg-slate-50 p-3 rounded-lg break-all text-[10px] font-mono text-slate-500 mb-4 border border-slate-200">
                  {generatedLink}
                </div>

                <div className="space-y-3">
                    <button
                        onClick={copyToClipboard}
                        className={`w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-lg text-white transition-colors ${
                            copied ? 'bg-green-600' : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                    >
                        {copied ? <><CheckCircle size={18} className="mr-2" /> Copied Link</> : <><Copy size={18} className="mr-2" /> Copy Link</>}
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={sendSMS}
                            className="flex items-center justify-center px-4 py-3 border border-slate-200 bg-white text-slate-700 font-bold rounded-lg hover:bg-slate-50 hover:text-primary-600 transition-colors"
                        >
                            <Smartphone size={18} className="mr-2" /> 
                            {clientPhone ? "Send Text" : "Open SMS"}
                        </button>
                        
                        <div className="relative group">
                             <button
                                onClick={clientEmail ? sendEmail : copyEmailTemplate}
                                className={`w-full flex items-center justify-center px-4 py-3 border border-slate-200 bg-white text-slate-700 font-bold rounded-lg hover:bg-slate-50 hover:text-primary-600 transition-colors ${emailCopied ? 'text-green-600' : ''}`}
                            >
                                {emailCopied ? <CheckCircle size={18} className="mr-2"/> : <Mail size={18} className="mr-2" />} 
                                {clientEmail ? "Gmail" : "Copy Tmpl"}
                            </button>
                            {/* Hover dropdown for choices if email is present */}
                            {clientEmail && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden hidden group-hover:block z-20">
                                    <button onClick={sendEmail} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-50">Open Gmail & Copy</button>
                                    <button onClick={copyEmailTemplate} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-50">Copy HTML Only</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">Summary</h4>
                  <p className="text-xs text-slate-500 mb-1 flex items-center"><Building size={12} className="mr-1"/> {getFinalCarrierName()}</p>
                  <p className="text-xs text-slate-500 mb-2">{address}</p>
                  <ul className="space-y-2">
                    {requirements.map(req => (
                      <li key={req.id} className="text-sm text-slate-600 flex items-start">
                        <span className={`h-2 w-2 mt-1.5 rounded-full mr-2 shrink-0 ${req.isMandatory ? 'bg-red-400' : 'bg-slate-300'}`}></span>
                        {req.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 min-h-[400px]">
                {isBackendConfigured ? (
                  <>
                    <HelpCircle size={48} className="mb-4 text-slate-300" />
                    <p className="text-center font-medium">Fill out client details to generate link.</p>
                    <p className="text-center text-sm mt-2 text-slate-400">Use "AI Auto-Fill" to extract data from a PDF policy declaration instantly.</p>
                  </>
                ) : (
                  <>
                    <Server size={48} className="mb-4 text-amber-300" />
                    <p className="text-center font-bold text-amber-600">Backend Connection Required</p>
                    <p className="text-center text-sm mt-2 text-slate-400">
                      Tiiny.host is a static host. You must deploy the Google Apps Script to handle file uploads.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;