import React, { useState, useEffect } from 'react';

// Live script loader for Firebase and Tailwind compat layers
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const LAWS = [
  "Speeding (1-10 MPH Over)",
  "Speeding (11-20 MPH Over)",
  "Speeding (21+ MPH Over)",
  "Reckless Driving",
  "Failure to Obey Traffic Control Device",
  "Failure to Yield to Emergency Vehicle",
  "Driving Under the Influence (DUI)",
  "Improper Lane Usage",
  "Driving Without License / Registration",
  "Operating an Unsafe Vehicle",
  "Failure to Stop at Red Light/Stop Sign",
  "Expired / Fraudulent License Plate",
  "Improper Passing"
];

const OFFICER_RANKS = [
  "Trooper",
  "Senior Trooper",
  "Master Trooper",
  "Corporal",
  "Sergeant",
  "Lieutenant",
  "Captain",
  "Major",
  "Chief",
  "Colonel"
];

// Standalone clean, high-fidelity SVGs to prevent any property-accessed JSX build errors on Vercel
const BadgeIcon = () => (
  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const ArrestIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const CitationIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IncidentIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const DatabaseIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('arrest'); // arrest, citation, incident, logs
  const [firebaseLoaded, setFirebaseLoaded] = useState(false);
  const [dbInstance, setDbInstance] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [logs, setLogs] = useState([]);

  // Search filter
  const [searchCallsign, setSearchCallsign] = useState('');

  // Notification Toast state
  const [toast, setToast] = useState(null);

  // Form States
  const initialOfficerState = { callsign: '', name: '', rank: 'Trooper' };
  const initialSuspectState = { robloxUser: '', discordUser: '', rpName: '', height: '', weight: '' };

  const [arrestForm, setArrestForm] = useState({
    ...initialSuspectState,
    charges: '',
    ...initialOfficerState
  });

  const [citationForm, setCitationForm] = useState({
    ...initialSuspectState,
    lawBroken: LAWS[0],
    ...initialOfficerState
  });

  const [incidentForm, setIncidentForm] = useState({
    robloxUser: '',
    discordUser: '',
    rpName: '',
    ...initialOfficerState
  });

  // Incident Stories (dynamic)
  const [stories, setStories] = useState([{ name: '', text: '' }]);

  // Ultra-robust global App ID fallback handler
  let appId = 'fhp-fsrp-cad';
  try {
    if (typeof __app_id !== 'undefined' && __app_id) {
      appId = __app_id;
    }
  } catch (e) {}

  const triggerToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  };

  // Dynamic initialization of Firebase v10 SDK compat layer 
  useEffect(() => {
    const initFirebase = async () => {
      try {
        // Load Tailwind first to guarantee instantly styled UI regardless of build environment
        await loadScript("https://cdn.tailwindcss.com");
        
        await loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
        await loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js");
        await loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js");
        
        const firebaseConfig = {
          apiKey: "AIzaSyCuXvFMJSs77N009MATue30N4RqmofJrL4",
          authDomain: "fhp-fsrp.firebaseapp.com",
          projectId: "fhp-fsrp",
          storageBucket: "fhp-fsrp.firebasestorage.app",
          messagingSenderId: "1001992895968",
          appId: "1:1001992895968:web:ea9642d9a1bcbe5120ff85",
          measurementId: "G-EY6NHB9HR6"
        };

        if (!window.firebase.apps.length) {
          window.firebase.initializeApp(firebaseConfig);
        }

        const auth = window.firebase.auth();
        const db = window.firebase.firestore();
        setDbInstance(db);

        // Safely attempt Custom Token authorization, falling back automatically to Anonymous upon mismatch/errors
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await auth.signInWithCustomToken(__initial_auth_token);
          } catch (authErr) {
            console.error("Custom token mismatch or error, falling back to anonymous authentication.", authErr);
            await auth.signInAnonymously();
          }
        } else {
          await auth.signInAnonymously();
        }

        auth.onAuthStateChanged((user) => {
          setCurrentUser(user);
          setFirebaseLoaded(true);
        });

      } catch (err) {
        console.error(err);
        setTimeout(initFirebase, 3000);
      }
    };

    initFirebase();
  }, []);

  // Sync real-time logs from Firestore (Strict Path compliant)
  useEffect(() => {
    if (!firebaseLoaded || !currentUser || !dbInstance) return;

    const logsCollectionRef = dbInstance
      .collection('artifacts')
      .doc(appId)
      .collection('public')
      .doc('data')
      .collection('logs');

    const unsubscribe = logsCollectionRef.onSnapshot(
      (snapshot) => {
        const fetched = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() });
        });
        // Sort inside javascript memory (Rule 2)
        fetched.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setLogs(fetched);
      },
      (error) => {
        console.error(error);
        triggerToast("Failed to fetch database records.", true);
      }
    );

    return () => unsubscribe();
  }, [firebaseLoaded, currentUser, dbInstance, appId]);

  // Handle Form Input changes
  const handleArrestChange = (e) => {
    const { name, value } = e.target;
    setArrestForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCitationChange = (e) => {
    const { name, value } = e.target;
    setCitationForm(prev => ({ ...prev, [name]: value }));
  };

  const handleIncidentChange = (e) => {
    const { name, value } = e.target;
    setIncidentForm(prev => ({ ...prev, [name]: value }));
  };

  // Dynamic Story Handlers
  const addStoryRow = () => {
    setStories(prev => [...prev, { name: '', text: '' }]);
  };

  const removeStoryRow = (index) => {
    if (stories.length <= 1) {
      triggerToast("At least one story is required.", true);
      return;
    }
    setStories(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleStoryChange = (index, field, value) => {
    setStories(prev => prev.map((s, idx) => idx === index ? { ...s, [field]: value } : s));
  };

  // Submit Logger helper
  const handleLogSubmission = async (logType, dataPayload) => {
    if (!firebaseLoaded || !dbInstance) {
      triggerToast("Database is currently connecting. Please wait.", true);
      return;
    }

    try {
      const payload = {
        logType,
        ...dataPayload,
        timestamp: Date.now(),
        dateString: new Date().toLocaleString(),
        officerUid: currentUser?.uid || "System"
      };

      const logsCollectionRef = dbInstance
        .collection('artifacts')
        .doc(appId)
        .collection('public')
        .doc('data')
        .collection('logs');

      await logsCollectionRef.add(payload);
      triggerToast("Record submitted successfully.");
      setActiveTab('logs');
    } catch (err) {
      console.error(err);
      triggerToast("Error writing to database.", true);
    }
  };

  const submitArrest = (e) => {
    e.preventDefault();
    handleLogSubmission('Arrest', arrestForm);
    setArrestForm(prev => ({
      ...initialSuspectState,
      charges: '',
      callsign: prev.callsign,
      name: prev.name,
      rank: prev.rank
    }));
  };

  const submitCitation = (e) => {
    e.preventDefault();
    handleLogSubmission('Citation', citationForm);
    setCitationForm(prev => ({
      ...initialSuspectState,
      lawBroken: LAWS[0],
      callsign: prev.callsign,
      name: prev.name,
      rank: prev.rank
    }));
  };

  const submitIncident = (e) => {
    e.preventDefault();
    const hasEmptyStory = stories.some(s => !s.name.trim() || !s.text.trim());
    if (hasEmptyStory) {
      triggerToast("Please fill out all added story boxes.", true);
      return;
    }

    const payload = {
      ...incidentForm,
      stories: stories
    };

    handleLogSubmission('Incident', payload);
    setIncidentForm(prev => ({
      robloxUser: '',
      discordUser: '',
      rpName: '',
      callsign: prev.callsign,
      name: prev.name,
      rank: prev.rank
    }));
    setStories([{ name: '', text: '' }]);
  };

  const deleteRecord = async (id) => {
    if (!dbInstance) return;
    try {
      const docRef = dbInstance
        .collection('artifacts')
        .doc(appId)
        .collection('public')
        .doc('data')
        .collection('logs')
        .doc(id);
      await docRef.delete();
      triggerToast("Record deleted.");
    } catch (err) {
      triggerToast("Failed to delete record.", true);
    }
  };

  // Rule 2 local matching (Hardened against type mismatches in database properties)
  const matchingLogs = logs.filter(log => {
    if (!searchCallsign.trim()) return true;
    const callsignStr = String(log.callsign || '');
    return callsignStr.toLowerCase().includes(searchCallsign.toLowerCase().trim());
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased text-sm selection:bg-amber-500 selection:text-slate-950">
      
      {/* Small Banner Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 border text-xs font-semibold tracking-wide shadow-2xl rounded-xl transition-all duration-300 ${toast.isError ? 'bg-red-950 border-red-500 text-red-200' : 'bg-slate-900 border-amber-400 text-amber-300'}`}>
          {toast.isError ? "ERROR: " : "SYSTEM: "}{toast.message}
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-72 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
          <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-center space-x-3">
            <BadgeIcon />
            <div>
              <h1 className="text-base font-bold tracking-wider text-amber-400 uppercase">FHP REGISTRY</h1>
              <p className="text-[10px] tracking-widest text-slate-400 uppercase font-medium">State Police Records Portal</p>
            </div>
          </div>

          <nav className="p-4 flex-1 space-y-1.5">
            <p className="px-2 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">RECORDING FORMS</p>
            
            <button
              onClick={() => setActiveTab('arrest')}
              className={`w-full flex items-center text-left px-4 py-3 rounded-xl font-medium tracking-wide transition duration-155 active:scale-[0.98] ${
                activeTab === 'arrest' 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              <ArrestIcon />
              Arrest Logs
            </button>

            <button
              onClick={() => setActiveTab('citation')}
              className={`w-full flex items-center text-left px-4 py-3 rounded-xl font-medium tracking-wide transition duration-155 active:scale-[0.98] ${
                activeTab === 'citation' 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              <CitationIcon />
              Citation Logs
            </button>

            <button
              onClick={() => setActiveTab('incident')}
              className={`w-full flex items-center text-left px-4 py-3 rounded-xl font-medium tracking-wide transition duration-155 active:scale-[0.98] ${
                activeTab === 'incident' 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              <IncidentIcon />
              Incident Logs
            </button>

            <div className="py-1.5 border-t border-slate-800 my-4" />

            <p className="px-2 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">DATABASE</p>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center text-left px-4 py-3 rounded-xl font-medium tracking-wide transition duration-155 active:scale-[0.98] ${
                activeTab === 'logs' 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              <DatabaseIcon />
              View Log Registry ({logs.length})
            </button>
          </nav>
          
          <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-[10px] text-slate-500 space-y-1 font-mono">
            <p>DB-STATE: {firebaseLoaded ? "ONLINE" : "OFFLINE"}</p>
            <p>SESSION ID: {currentUser ? String(currentUser.uid || '').substring(0, 10) : "N/A"}</p>
          </div>
        </aside>

        {/* Form and Data display area */}
        <main className="flex-1 p-6 md:p-8 bg-slate-950">
          
          {/* ARREST LOG TAB */}
          {activeTab === 'arrest' && (
            <div className="max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 bg-slate-950/60 border-b border-slate-800">
                <h2 className="text-base font-bold text-amber-400 uppercase tracking-wide">ARREST BOOKING FORM</h2>
                <p className="text-xs text-slate-400 mt-1">File a secure arrest booking log for the active patrol.</p>
              </div>

              <form onSubmit={submitArrest} className="p-6 space-y-6">
                
                {/* Suspect Demographics */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5">Suspect Demographics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Roblox Username</label>
                      <input 
                        type="text" 
                        name="robloxUser" 
                        required 
                        value={arrestForm.robloxUser} 
                        onChange={handleArrestChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Discord Username</label>
                      <input 
                        type="text" 
                        name="discordUser" 
                        required 
                        value={arrestForm.discordUser} 
                        onChange={handleArrestChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Suspect RP Character Name</label>
                      <input 
                        type="text" 
                        name="rpName" 
                        required 
                        value={arrestForm.rpName} 
                        onChange={handleArrestChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Suspect Height</label>
                      <input 
                        type="text" 
                        name="height" 
                        required 
                        value={arrestForm.height} 
                        onChange={handleArrestChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Suspect Weight</label>
                      <input 
                        type="text" 
                        name="weight" 
                        required 
                        value={arrestForm.weight} 
                        onChange={handleArrestChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                  </div>
                </div>

                {/* Charges */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5">Charges Details</h3>
                  <label className="block text-xs text-slate-400 font-semibold mb-1.5">Arrest Charges</label>
                  <textarea 
                    name="charges" 
                    required 
                    value={arrestForm.charges} 
                    onChange={handleArrestChange} 
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200"
                  />
                </div>

                {/* Officer Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5">Submitting Officer Signature</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Officer Callsign</label>
                      <input 
                        type="text" 
                        name="callsign" 
                        required 
                        value={arrestForm.callsign} 
                        onChange={handleArrestChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Officer Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        required 
                        value={arrestForm.name} 
                        onChange={handleArrestChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Officer Rank</label>
                      <select 
                        name="rank" 
                        value={arrestForm.rank} 
                        onChange={handleArrestChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200"
                      >
                        {OFFICER_RANKS.map(rank => (
                          <option key={rank} value={rank}>{rank}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button type="submit" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-3 rounded-xl transition duration-150 active:scale-95 shadow-md">
                    Submit Arrest Record
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CITATION LOG TAB */}
          {activeTab === 'citation' && (
            <div className="max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 bg-slate-950/60 border-b border-slate-800">
                <h2 className="text-base font-bold text-amber-400 uppercase tracking-wide">CITATION BOOKING FORM</h2>
                <p className="text-xs text-slate-400 mt-1">File a standard motorist citation ticket.</p>
              </div>

              <form onSubmit={submitCitation} className="p-6 space-y-6">
                
                {/* Driver Demographics */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5">Driver Demographics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Roblox Username</label>
                      <input 
                        type="text" 
                        name="robloxUser" 
                        required 
                        value={citationForm.robloxUser} 
                        onChange={handleCitationChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Discord Username</label>
                      <input 
                        type="text" 
                        name="discordUser" 
                        required 
                        value={citationForm.discordUser} 
                        onChange={handleCitationChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Suspect RP Character Name</label>
                      <input 
                        type="text" 
                        name="rpName" 
                        required 
                        value={citationForm.rpName} 
                        onChange={handleCitationChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Suspect Height</label>
                      <input 
                        type="text" 
                        name="height" 
                        required 
                        value={citationForm.height} 
                        onChange={handleCitationChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Suspect Weight</label>
                      <input 
                        type="text" 
                        name="weight" 
                        required 
                        value={citationForm.weight} 
                        onChange={handleCitationChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                  </div>
                </div>

                {/* Infractions */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5">Traffic Violation Selection</h3>
                  <label className="block text-xs text-slate-400 font-semibold mb-1.5">Primary Law Broken</label>
                  <select 
                    name="lawBroken" 
                    value={citationForm.lawBroken} 
                    onChange={handleCitationChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200"
                  >
                    {LAWS.map((law) => (
                      <option key={law} value={law}>{law}</option>
                    ))}
                  </select>
                </div>

                {/* Officer Signature */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5">Writing Officer Signature</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Officer Callsign</label>
                      <input 
                        type="text" 
                        name="callsign" 
                        required 
                        value={citationForm.callsign} 
                        onChange={handleCitationChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Officer Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        required 
                        value={citationForm.name} 
                        onChange={handleCitationChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Officer Rank</label>
                      <select 
                        name="rank" 
                        value={citationForm.rank} 
                        onChange={handleCitationChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200"
                      >
                        {OFFICER_RANKS.map(rank => (
                          <option key={rank} value={rank}>{rank}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button type="submit" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-3 rounded-xl transition duration-150 active:scale-95 shadow-md">
                    Submit Citation
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* INCIDENT LOG TAB */}
          {activeTab === 'incident' && (
            <div className="max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 bg-slate-950/60 border-b border-slate-800">
                <h2 className="text-base font-bold text-amber-400 uppercase tracking-wide">INCIDENT FILING FORM</h2>
                <p className="text-xs text-slate-400 mt-1">Log general incidents, dynamic case reports and citizen statements.</p>
              </div>

              <form onSubmit={submitIncident} className="p-6 space-y-6">
                
                {/* Subject Demographics */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5">Subject Demographics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Roblox Username</label>
                      <input 
                        type="text" 
                        name="robloxUser" 
                        required 
                        value={incidentForm.robloxUser} 
                        onChange={handleIncidentChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Discord Username</label>
                      <input 
                        type="text" 
                        name="discordUser" 
                        required 
                        value={incidentForm.discordUser} 
                        onChange={handleIncidentChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1.5">RP Character Name</label>
                    <input 
                      type="text" 
                      name="rpName" 
                      required 
                      value={incidentForm.rpName} 
                      onChange={handleIncidentChange} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                    />
                  </div>
                </div>

                {/* Dynamic People's Stories Container */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">People's Stories</h3>
                    <button 
                      type="button" 
                      onClick={addStoryRow}
                      className="text-xs text-amber-400 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 px-4 py-2 rounded-xl transition duration-150 active:scale-95"
                    >
                      + Add Person's Story
                    </button>
                  </div>

                  <div className="space-y-4">
                    {stories.map((story, index) => (
                      <div key={index} className="p-5 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-3 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Witness/Complainant #{index + 1}</span>
                          <button 
                            type="button" 
                            onClick={() => removeStoryRow(index)}
                            className="text-xs text-red-400 hover:text-red-300 font-semibold transition"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-slate-400 font-semibold mb-1.5">Full Name / Roblox tag</label>
                          <input 
                            type="text"
                            required
                            placeholder="Name of person providing account"
                            value={story.name}
                            onChange={(e) => handleStoryChange(index, 'name', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 font-semibold mb-1.5">Story Account / Box</label>
                          <textarea 
                            required
                            placeholder="Type details of story account..."
                            value={story.text}
                            onChange={(e) => handleStoryChange(index, 'text', e.target.value)}
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Officer Signature */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5">Submitting Officer Signature</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Officer Callsign</label>
                      <input 
                        type="text" 
                        name="callsign" 
                        required 
                        value={incidentForm.callsign} 
                        onChange={handleIncidentChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Officer Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        required 
                        value={incidentForm.name} 
                        onChange={handleIncidentChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Officer Rank</label>
                      <select 
                        name="rank" 
                        value={incidentForm.rank} 
                        onChange={handleIncidentChange} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-slate-200"
                      >
                        {OFFICER_RANKS.map(rank => (
                          <option key={rank} value={rank}>{rank}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button type="submit" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-3 rounded-xl transition duration-150 active:scale-95 shadow-md">
                    Submit Incident Log
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SYSTEM DATABASE SCREEN */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              
              {/* Simple Database Header / Filtering */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-base font-bold text-amber-400 uppercase tracking-wide">SYSTEM LOGS DATABASE</h2>
                    <p className="text-xs text-slate-400 mt-1">Displays real-time synced files. Search records by callsign below.</p>
                  </div>
                </div>

                {/* Search Input Box */}
                <div className="relative">
                  <input 
                    type="text"
                    value={searchCallsign}
                    onChange={(e) => setSearchCallsign(e.target.value)}
                    placeholder="Search Officer's Callsign (e.g. 1A-42)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-200 transition"
                  />
                  {searchCallsign && (
                    <button 
                      onClick={() => setSearchCallsign('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-100 bg-slate-800/60 px-2 py-1 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Matching logs display list */}
              <div className="space-y-4">
                {matchingLogs.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                    No registry entries found matching search query.
                  </div>
                ) : (
                  matchingLogs.map((log) => {
                    const isArrest = log.logType === 'Arrest';
                    const isCitation = log.logType === 'Citation';
                    const isIncident = log.logType === 'Incident';

                    return (
                      <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        
                        {/* Registry Header */}
                        <div className="bg-slate-950/60 p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-400 font-mono">#{String(log.id || '').substring(0, 8).toUpperCase()}</span>
                            <span className="text-slate-500">|</span>
                            <span className={`font-bold uppercase ${isArrest ? 'text-red-400' : isCitation ? 'text-blue-400' : 'text-amber-400'}`}>
                              [{log.logType}]
                            </span>
                            <span className="text-slate-500 text-[11px] font-medium">({log.dateString})</span>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <span className="text-slate-400">
                              OFFICER: <strong className="text-slate-100">[{log.callsign}] {log.rank} {log.name}</strong>
                            </span>
                            <button 
                              onClick={() => deleteRecord(log.id)}
                              className="text-red-400 hover:text-red-300 font-semibold text-xs bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition duration-150"
                            >
                              Expunge
                            </button>
                          </div>
                        </div>

                        {/* Record details */}
                        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
                          
                          {/* Person details */}
                          <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl">
                            <p className="font-bold text-slate-400 border-b border-slate-800 pb-1.5 text-[11px] uppercase tracking-wider">Subject Profile</p>
                            <div>
                              <span className="text-slate-500">Roblox:</span> <span className="text-slate-200">{log.robloxUser}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Discord:</span> <span className="text-slate-200">{log.discordUser}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">RP Character:</span> <span className="text-amber-400 font-semibold">{log.rpName}</span>
                            </div>
                            {(isArrest || isCitation) && (
                              <>
                                <div>
                                  <span className="text-slate-500">Height:</span> <span className="text-slate-200">{log.height || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Weight:</span> <span className="text-slate-200">{log.weight || "N/A"}</span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Infraction Account or Stories */}
                          <div className="md:col-span-2 space-y-2">
                            {isArrest && (
                              <div className="bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl h-full">
                                <p className="font-bold text-red-400 border-b border-slate-800 pb-1.5 text-[11px] uppercase tracking-wider">Booking Charges</p>
                                <p className="mt-2.5 text-slate-200 leading-relaxed">{log.charges}</p>
                              </div>
                            )}

                            {isCitation && (
                              <div className="bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl h-full">
                                <p className="font-bold text-blue-400 border-b border-slate-800 pb-1.5 text-[11px] uppercase tracking-wider">Law Broken Infraction</p>
                                <div className="mt-3 text-slate-100 font-bold text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 inline-block">
                                  {log.lawBroken}
                                </div>
                              </div>
                            )}

                            {isIncident && (
                              <div className="bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl space-y-3">
                                <p className="font-bold text-amber-500 border-b border-slate-800 pb-1.5 text-[11px] uppercase tracking-wider">Incident Narrative / Stories</p>
                                <div className="space-y-3">
                                  {log.stories && Array.isArray(log.stories) ? (
                                    log.stories.map((story, sIndex) => (
                                      <div key={sIndex} className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                                        <div className="flex justify-between items-center mb-1 text-[11px]">
                                          <span className="text-amber-405 font-bold">Story Account from:</span>
                                          <span className="text-slate-200 font-bold">{story.name}</span>
                                        </div>
                                        <p className="text-slate-300 italic whitespace-pre-wrap leading-relaxed">"{story.text}"</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-slate-500">No witness narrative files synced.</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
