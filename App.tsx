
import React, { useState, useEffect, useRef } from 'react';
import { getCropAdvisory, analyzeCropImage, getConversationalAdvice, translateUI, getSustainabilityInsights, connectLiveScanner } from './geminiService';
import { CropData, AdvisoryResult, SUPPORTED_LANGUAGES, Page, ImageAnalysisResult, UIStrings, DEFAULT_UI_STRINGS, SustainabilityInsight } from './types';

// Icons
const IconHome = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const IconChart = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const IconCamera = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconLive = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const IconMic = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const IconLightbulb = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-5.636l-.707-.707m12.728 0l-.707.707M6.364 18.364l-.707-.707M12 21v-1m0-12a3 3 0 00-3 3c0 1.32.4 2.503 1 3.5m4-3.5c0 1.32-.4 2.503-1 3.5m0 0a13.992 13.992 0 01-1 3.5m-1-3.5a13.992 13.992 0 00-1 3.5" /></svg>;

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedLang, setSelectedLang] = useState(SUPPORTED_LANGUAGES[0]);
  const [ui, setUi] = useState<UIStrings>(DEFAULT_UI_STRINGS);
  const [isTranslatingUi, setIsTranslatingUi] = useState(false);

  // Shared State
  const [loading, setLoading] = useState(false);

  // Yield Prediction State
  const [yieldData, setYieldData] = useState<CropData>({ cropName: '', region: '', rainfall: 800, nitrogen: 40, phosphorus: 30, potassium: 30 });
  const [yieldResult, setYieldResult] = useState<AdvisoryResult | null>(null);

  // Image Analysis State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<ImageAnalysisResult | null>(null);

  // Assistant State
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Insights State
  const [insights, setInsights] = useState<SustainabilityInsight[]>([]);

  // Live Scan State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [liveResult, setLiveResult] = useState<ImageAnalysisResult | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Load UI Translations
  useEffect(() => {
    const updateUi = async () => {
      setIsTranslatingUi(true);
      const newUi = await translateUI(selectedLang.name);
      setUi(newUi);
      setIsTranslatingUi(false);
      refreshInsights();
    };
    updateUi();
  }, [selectedLang]);

  const refreshInsights = async () => {
    try {
      const data = await getSustainabilityInsights(selectedLang.name);
      setInsights(data);
    } catch (e) { console.error(e); }
  };

  // Camera Management
  const startCamera = async () => {
    if (isLiveActive || isStartingCamera) return;
    setLiveError(null);
    setLiveResult(null);
    setIsStartingCamera(true);
    
    let stream: MediaStream | null = null;
    
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      });
    } catch (err) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (fallbackErr) {
        setLiveError("Could not access camera. Please check permissions.");
        setIsStartingCamera(false);
        return;
      }
    }

    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
        setIsLiveActive(true);
      } catch (playErr) {
        setLiveError("Camera feed failed to start.");
      }
    }
    setIsStartingCamera(false);
  };

  const stopCamera = () => {
    setIsLiveActive(false);
    setIsStartingCamera(false);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setLiveResult(null);
  };

  const handleCaptureSnap = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    
    setIsCapturing(true);
    setLiveResult(null);
    setLiveError(null);

    try {
      const ctx = canvasRef.current.getContext('2d', { alpha: false });
      if (!ctx) return;
      
      // Use higher res for capturing to get better analysis
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      
      const base64Full = canvasRef.current.toDataURL('image/jpeg', 0.8);
      const base64Data = base64Full.split(',')[1];
      const mimeType = 'image/jpeg';
      
      const res = await analyzeCropImage(base64Data, mimeType, selectedLang.name);
      setLiveResult(res);
    } catch (err) {
      console.error(err);
      setLiveError("AI Analysis failed. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    if (currentPage !== 'live_scan') stopCamera();
  }, [currentPage]);

  // Navigation Helper
  const navItem = (page: Page, labelKey: keyof UIStrings, Icon: React.FC) => (
    <button 
      onClick={() => setCurrentPage(page)}
      className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentPage === page ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <Icon />
      <span className="text-[10px] font-bold uppercase tracking-tight">{ui[labelKey]}</span>
    </button>
  );

  // Handlers
  const handleYieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await getCropAdvisory(yieldData, selectedLang.name);
      setYieldResult(res);
    } catch (err) { alert('Error generating prediction'); }
    finally { setLoading(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setImageResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    setLoading(true);
    try {
      const base64 = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];
      const res = await analyzeCropImage(base64, mimeType, selectedLang.name);
      setImageResult(res);
    } catch (err) { alert('Error analyzing image'); }
    finally { setLoading(false); }
  };

  const handleAssistantSubmit = async (textQuery?: string) => {
    const q = textQuery || query;
    if (!q.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', text: q }]);
    setQuery('');
    setLoading(true);
    try {
      const res = await getConversationalAdvice(q, selectedLang.name);
      setChatHistory(prev => [...prev, { role: 'ai', text: res }]);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(res);
        utterance.lang = selectedLang.code;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) { alert('Assistant error'); }
    finally { setLoading(false); }
  };

  const startVoiceCapture = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang.code;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleAssistantSubmit(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 lg:pb-0 lg:pl-20">
      
      {/* Sidebar Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 lg:top-0 lg:bottom-0 lg:w-20 lg:border-t-0 lg:border-r z-50 flex lg:flex-col justify-around lg:justify-center lg:gap-8 items-center p-2 shadow-lg lg:shadow-none">
        {navItem('home', 'home', IconHome)}
        {navItem('prediction', 'prediction', IconChart)}
        {navItem('live_scan', 'live_scan', IconLive)}
        {navItem('analysis', 'analysis', IconCamera)}
        {navItem('assistant', 'assistant', IconMic)}
        {navItem('insights', 'insights', IconLightbulb)}
      </nav>

      {/* Header */}
      <header className="bg-white p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-40">
        <h1 className="text-xl font-black text-emerald-800 tracking-tighter">CropIQ <span className="text-emerald-500 font-medium text-xs">GLOBAL</span></h1>
        <div className="flex items-center gap-2">
          {isTranslatingUi && <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>}
          <select 
            className="text-xs font-bold bg-slate-100 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500"
            value={selectedLang.code}
            onChange={(e) => {
              const lang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
              if (lang) setSelectedLang(lang);
            }}
          >
            {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-10 max-w-6xl mx-auto w-full">
        
        {/* HOME PAGE */}
        {currentPage === 'home' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-emerald-600 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-4xl font-black mb-4 leading-tight">{ui.tagline}</h2>
                <p className="opacity-90 max-w-md mb-6 leading-relaxed">{ui.welcome}</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setCurrentPage('live_scan')} className="bg-white text-emerald-700 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-all">Start Live Scanner</button>
                  <button onClick={() => setCurrentPage('prediction')} className="bg-emerald-500/50 backdrop-blur text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-500/70 transition-all">{ui.start_prediction}</button>
                </div>
              </div>
              <div className="absolute top-[-20px] right-[-20px] w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard title={ui.live_scan} desc="Real-time crop identification through your camera stream." icon="👁️" />
              <FeatureCard title={ui.analysis} desc="Deep diagnostics for plant diseases via photo upload." icon="🌿" />
              <FeatureCard title={ui.insights} desc="Sustainable farming lab for eco-friendly productivity." icon="🔬" />
            </div>
          </div>
        )}

        {/* LIVE SCANNER PAGE - POINT AND SNAP */}
        {currentPage === 'live_scan' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">{ui.live_vision_title}</h2>
              <p className="text-slate-500">Center the plant leaf in the frame and take a snap for instant analysis.</p>
            </div>
            
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-video shadow-2xl border-4 border-slate-900 min-h-[300px] flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className={`w-full h-full object-cover ${isLiveActive ? 'block' : 'hidden'}`} 
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {isLiveActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  {/* Viewfinder Target */}
                  <div className="w-48 h-48 border-2 border-dashed border-white/50 rounded-2xl flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-emerald-400 rounded-full animate-pulse opacity-50"></div>
                  </div>
                  <p className="mt-4 text-[10px] font-bold text-white uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Target Center</p>
                </div>
              )}

              {isCapturing && (
                <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur flex flex-col items-center justify-center z-10">
                   <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                   <p className="text-white font-black uppercase text-xs tracking-widest">Running AI Diagnostics...</p>
                </div>
              )}

              {liveResult && (
                <div className="absolute inset-0 bg-white overflow-y-auto p-6 lg:p-10 z-20 animate-slideUp">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-3xl font-black text-slate-800">{liveResult.healthStatus}</h3>
                    <button onClick={() => setLiveResult(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Detected Plant Issues</p>
                      <div className="flex flex-wrap gap-2">
                        {liveResult.identifiedIssues.map(issue => <span key={issue} className="bg-emerald-50 text-emerald-800 font-bold px-4 py-2 rounded-xl text-sm border border-emerald-100">{issue}</span>)}
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl">
                      <p className="text-xs font-black uppercase text-slate-400 mb-2">Detailed Advice</p>
                      <p className="text-slate-700 leading-relaxed font-medium">{liveResult.recommendations}</p>
                    </div>

                    <button 
                      onClick={() => setLiveResult(null)} 
                      className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-emerald-700 transition-all"
                    >
                      Back to Live Feed
                    </button>
                  </div>
                </div>
              )}

              {!isLiveActive && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-8">
                  {isStartingCamera ? (
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <div className="mb-6 w-16 h-16 bg-emerald-600/20 border border-emerald-500/40 rounded-full flex items-center justify-center">
                        <IconLive />
                      </div>
                      <button 
                        onClick={startCamera} 
                        className="bg-emerald-600 text-white font-black px-12 py-5 rounded-2xl shadow-2xl hover:bg-emerald-700 transform hover:scale-105 active:scale-95 transition-all"
                      >
                        Initialize Live Scanner
                      </button>
                      {liveError && <p className="mt-6 text-red-400 text-xs font-bold text-center max-w-xs">{liveError}</p>}
                    </>
                  )}
                </div>
              )}
            </div>

            {isLiveActive && !liveResult && (
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleCaptureSnap} 
                  disabled={isCapturing}
                  className={`w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 ${isCapturing ? 'opacity-50 grayscale' : ''}`}
                >
                  <IconCamera />
                  Take a Snap for AI Analysis
                </button>
                <button onClick={stopCamera} className="w-full text-slate-400 font-bold py-2 text-xs uppercase tracking-widest hover:text-slate-600">
                  Terminate Camera
                </button>
              </div>
            )}
          </div>
        )}

        {/* PREDICTION PAGE */}
        {currentPage === 'prediction' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">📊 {ui.yield_forecaster}</h3>
              <form onSubmit={handleYieldSubmit} className="space-y-4">
                <input placeholder={ui.crop_name} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-emerald-500 outline-none" value={yieldData.cropName} onChange={e => setYieldData({...yieldData, cropName: e.target.value})} />
                <input placeholder={ui.region} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-emerald-500 outline-none" value={yieldData.region} onChange={e => setYieldData({...yieldData, region: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-400">{ui.rainfall}</label>
                    <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-emerald-500 outline-none" value={yieldData.rainfall} onChange={e => setYieldData({...yieldData, rainfall: +e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400">{ui.nitrogen}</label>
                    <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-emerald-500 outline-none" value={yieldData.nitrogen} onChange={e => setYieldData({...yieldData, nitrogen: +e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400">{ui.phosphorus}</label>
                    <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-emerald-500 outline-none" value={yieldData.phosphorus} onChange={e => setYieldData({...yieldData, phosphorus: +e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-emerald-700 transform active:scale-95 transition-all">
                  {loading ? ui.predicting : ui.generate}
                </button>
              </form>
            </div>
            <div className="space-y-4">
              {yieldResult ? (
                <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-xl animate-slideUp">
                  <h2 className="text-4xl font-black text-emerald-800 mb-4">{yieldResult.yieldPrediction}</h2>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">{yieldResult.explanation}</p>
                  <div className="space-y-4">
                    <ResultSection icon="💧" title="Irrigation" text={yieldResult.irrigationAdvisory} />
                    <ResultSection icon="🌱" title="Fertilizer" text={yieldResult.fertilizationAdvisory} />
                  </div>
                </div>
              ) : (
                <div className="h-full bg-white/50 border-2 border-dashed border-slate-300 rounded-3xl flex items-center justify-center min-h-[400px]">
                  <p className="text-slate-400 italic">Yield prediction results appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANALYSIS PAGE */}
        {currentPage === 'analysis' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
              <h3 className="text-2xl font-black mb-2">{ui.health_scanner}</h3>
              <p className="text-slate-500 mb-6">{ui.upload_desc}</p>
              <div className="relative group cursor-pointer mb-8 max-w-lg mx-auto">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className={`aspect-video rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/20 flex flex-col items-center justify-center transition-all group-hover:bg-emerald-50 ${selectedImage ? 'border-none ring-4 ring-emerald-100' : ''}`}>
                  {selectedImage ? (
                    <img src={selectedImage} alt="Crop" className="h-full w-full object-cover rounded-3xl" />
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 text-emerald-500"><IconCamera /></div>
                      <p className="text-sm font-black text-emerald-700">Click to Browse Photos</p>
                    </>
                  )}
                </div>
              </div>
              {selectedImage && !imageResult && (
                <button onClick={handleAnalyzeImage} className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-2xl hover:bg-emerald-700 transition-all disabled:opacity-50">
                  {loading ? ui.analyzing : ui.scan_btn}
                </button>
              )}
            </div>
            {imageResult && (
              <div className="bg-white p-8 rounded-3xl border-l-[12px] border-emerald-500 shadow-xl animate-slideUp">
                <h4 className="text-3xl font-black text-slate-800 mb-3">{imageResult.healthStatus}</h4>
                <div className="mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">{ui.detected_issues}</p>
                  <div className="flex flex-wrap gap-2">
                    {imageResult.identifiedIssues.map(issue => <span key={issue} className="bg-emerald-50 text-emerald-800 font-bold px-4 py-2 rounded-xl text-sm border border-emerald-100">{issue}</span>)}
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl">
                   <p className="text-xs font-black uppercase text-slate-400 mb-2">Expert Recommendations</p>
                   <p className="text-slate-700 leading-relaxed font-medium">{imageResult.recommendations}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ASSISTANT PAGE */}
        {currentPage === 'assistant' && (
          <div className="flex flex-col h-[75vh] lg:h-[85vh] max-w-4xl mx-auto animate-fadeIn relative">
            <div className="bg-emerald-800 p-6 rounded-t-3xl border-b border-emerald-700 flex items-center justify-between text-white shadow-lg">
              <span className="font-black flex items-center gap-3">🤖 {ui.voice_assistant_title}</span>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest">Global Node: Active</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white border-x border-slate-200 scrollbar-hide">
              {chatHistory.map((chat, idx) => (
                <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-5 rounded-3xl ${chat.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none shadow-lg' : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200 shadow-sm'}`}>
                    <p className="text-sm font-medium whitespace-pre-wrap">{chat.text}</p>
                  </div>
                </div>
              ))}
              {loading && <div className="bg-slate-100 p-4 rounded-2xl animate-pulse text-slate-400 text-xs w-48 font-bold uppercase tracking-widest">{ui.thinking}</div>}
            </div>
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-b-3xl shadow-2xl flex gap-3">
              <button onClick={startVoiceCapture} className={`p-5 rounded-2xl shadow-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-emerald-600 hover:bg-emerald-50'}`}><IconMic /></button>
              <input placeholder={ui.type_placeholder} className="flex-1 p-4 bg-white rounded-2xl outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 font-medium" value={query} onChange={e => setQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAssistantSubmit()} />
              <button onClick={() => handleAssistantSubmit()} className="bg-emerald-800 text-white p-5 rounded-2xl hover:bg-emerald-900 shadow-lg transform active:scale-95"><svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
            </div>
          </div>
        )}

        {/* INSIGHTS PAGE */}
        {currentPage === 'insights' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-slate-800">{ui.sustainable_title}</h2>
              <p className="text-slate-500">{ui.educational_tips}</p>
            </div>
            {insights.length === 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                  {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-200 rounded-2xl"></div>)}
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {insights.map((insight, idx) => (
                  <SustainabilityCard 
                    key={idx}
                    insight={insight}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {isTranslatingUi && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-emerald-100 font-black text-xl animate-pulse tracking-tighter uppercase">Initializing Language: {selectedLang.name}</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scan { from { top: 0; } to { top: 100%; } }
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.6s ease-out; }
        .animate-scan { animation: scan 2s linear infinite; }
        .animate-spin-slow { animation: spinSlow 12s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};

const FeatureCard: React.FC<{ title: string, desc: string, icon: string }> = ({ title, desc, icon }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 hover:shadow-2xl hover:-translate-y-1 transition-all">
    <div className="text-4xl mb-5">{icon}</div>
    <h4 className="font-black text-slate-800 mb-2 text-lg">{title}</h4>
    <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
  </div>
);

const ResultSection: React.FC<{ icon: string, title: string, text: string }> = ({ icon, title, text }) => (
  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 group hover:bg-emerald-50 transition-colors">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{title}</span>
    </div>
    <p className="text-sm text-slate-800 leading-relaxed font-medium">{text}</p>
  </div>
);

const SustainabilityCard: React.FC<{ insight: SustainabilityInsight }> = ({ insight }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-lg hover:shadow-2xl">
      <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-4 py-2 rounded-bl-3xl shadow-sm">{insight.tag}</div>
      <h4 className="text-xl font-black text-slate-800 mb-4 pr-16 leading-tight">{insight.title}</h4>
      <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">{insight.content}</p>
      
      {expanded && insight.methodology && (
        <div className="mt-4 pt-6 border-t border-slate-100 animate-fadeIn">
          <p className="text-[10px] font-black uppercase text-emerald-600 mb-3 tracking-widest">Protocol</p>
          <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100">
             <p className="text-xs text-slate-700 leading-relaxed font-semibold">{insight.methodology}</p>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="text-emerald-600 font-black text-xs flex items-center gap-2 hover:gap-3 transition-all mt-4 uppercase tracking-tighter"
      >
        {expanded ? 'Minimize Details' : 'View Implementation'} <span>→</span>
      </button>
    </div>
  );
};

export default App;
