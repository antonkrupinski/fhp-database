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

// Standalone clean, high-fidelity SVGs to prevent property-accessed rendering errors on build
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

const ClockIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-10a4 4 0 11-8 0 4 4 0 018 0zm6 11v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('duty'); // duty, dutyboard, arrest, citation, incident, logs
  const [firebaseLoaded, setFirebaseLoaded] = useState(false);
  const [dbInstance, setDbInstance] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [logs, setLogs] = useState([]);

  // Discord State
  const [discordUser, setDiscordUser] = useState(null); // { username, avatarUrl, roles: [] }
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Discord Login Form Input Simulation
  const [discordInputUser, setDiscordInputUser] = useState('');
  const [discordInputAvatar, setDiscordInputAvatar] = useState('');
  const [hasVerifiedRole, setHasVerifiedRole] = useState(true); // Default to simulated role presence for convenience

  // Duty State
  const [onDuty, setOnDuty] = useState(false);
  const [shiftStartTime, setShiftStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [dutyLogs, setDutyLogs] = useState([]); // Synced duty logs for this week

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

  // Helper: Sunday 00:00:00 Reset Calculation
  const getStartOfCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday
    const diff = now.getDate() - day; // Adjust back to previous Sunday
    const sunday = new Date(now.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday.getTime();
  };

  // Timer effect for On Duty stopwatch
  useEffect(() => {
    let interval = null;
    if (onDuty && shiftStartTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - shiftStartTime) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [onDuty, shiftStartTime]);

  // Dynamic initialization of Firebase v10 SDK compat layer 
  useEffect(() => {
    const initFirebase = async () => {
      try {
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

  // Sync real-time logs & duty logs from Firestore (Strict Path compliant)
  useEffect(() => {
    if (!firebaseLoaded || !currentUser || !dbInstance) return;

    // 1. Sync CAD Crime Logs
    const logsCollectionRef = dbInstance
      .collection('artifacts')
      .doc(appId)
      .collection('public')
      .doc('data')
      .collection('logs');

    const unsubscribeLogs = logsCollectionRef.onSnapshot(
      (snapshot) => {
        const fetched = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() });
        });
        fetched.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setLogs(fetched);
      },
      (error) => {
        console.error(error);
        triggerToast("Failed to fetch database crime records.", true);
      }
    );

    // 2. Sync Shift Duty Records (Weekly auto-reset calculated dynamically by timestamp)
    const dutyCollectionRef = dbInstance
      .collection('artifacts')
      .doc(appId)
      .collection('public')
      .doc('data')
      .collection('duty_sessions');

    const unsubscribeDuty = dutyCollectionRef.onSnapshot(
      (snapshot) => {
        const fetchedDuty = [];
        snapshot.forEach((doc) => {
          fetchedDuty.push({ id: doc.id, ...doc.data() });
        });
        setDutyLogs(fetchedDuty);
      },
      (error) => {
        console.error(error);
        triggerToast("Failed to fetch database shift records.", true);
      }
    );

    return () => {
      unsubscribeLogs();
      unsubscribeDuty();
    };
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

  // Discord Login Simulator Submit
  const handleDiscordMockLogin = (e) => {
    e.preventDefault();
    if (!discordInputUser.trim()) {
      triggerToast("Please provide a valid Discord username.", true);
      return;
    }

    const rolesList = [];
    if (hasVerifiedRole) {
      rolesList.push("1519891015224524871");
    }

    const mockAvatar = discordInputAvatar.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(discordInputUser)}`;

    setDiscordUser({
      username: discordInputUser.trim(),
      avatarUrl: mockAvatar,
      roles: rolesList
    });

    setShowDiscordModal(false);
    triggerToast(`Authenticated with Discord as ${discordInputUser.trim()}`);
  };

  const handleDiscordLogout = () => {
    setDiscordUser(null);
    setOnDuty(false);
    setShiftStartTime(null);
    setShowProfileDropdown(false);
    triggerToast("Logged out of Discord.");
  };

  // Shift Control Handlers
  const handleStartShift = async () => {
    if (!discordUser) {
      triggerToast("You must log in with Discord first.", true);
      return;
    }
    if (!discordUser.roles.includes("1519891015224524871")) {
      triggerToast("You lack the required verified FHP role to start a shift.", true);
      return;
    }

    setOnDuty(true);
    setShiftStartTime(Date.now());
    triggerToast("Trooper shift actively logged ON DUTY.");
  };

  const handleStopShift = async () => {
    if (!onDuty || !shiftStartTime) return;

    const durationSeconds = Math.floor((Date.now() - shiftStartTime) / 1000);
    setOnDuty(false);
    setShiftStartTime(null);

    if (durationSeconds < 5) {
      triggerToast("Shift was too short to be registered onto public database. (Minimum 5 seconds)");
      return;
    }

    // Save to Firebase
    try {
      const payload = {
        discordUsername: discordUser.username,
        avatarUrl: discordUser.avatarUrl,
        duration: durationSeconds,
        timestamp: Date.now(),
        dateString: new Date().toLocaleString()
      };

      const dutyCollectionRef = dbInstance
        .collection('artifacts')
        .doc(appId)
        .collection('public')
        .doc('data')
        .collection('duty_sessions');

      await dutyCollectionRef.add(payload);
      triggerToast(`Shift completed: ${Math.floor(durationSeconds / 60)} minutes logged to board.`);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to write shift log to database.", true);
    }
  };

  // Format Elapsed Time (Stopwatch)
  const formatStopwatch = (totalSecs) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  // Compute Weekly Duty Board Stats (Using Dynamic Client-Side Auto-Reset Strategy)
  const weeklyStartTimestamp = getStartOfCurrentWeek();
  const aggregatedWeeklyBoard = {};

  dutyLogs.forEach(session => {
    if (session.timestamp >= weeklyStartTimestamp) {
      const userKey = session.discordUsername;
      if (!aggregatedWeeklyBoard[userKey]) {
        aggregatedWeeklyBoard[userKey] = {
          username: session.discordUsername,
          avatarUrl: session.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(session.discordUsername)}`,
          totalDuration: 0
        };
      }
      aggregatedWeeklyBoard[userKey].totalDuration += Number(session.duration || 0);
    }
  });

  const weeklyBoardList = Object.values(aggregatedWeeklyBoard);

  // Compute logged-in user's weekly dynamic total
  const myWeeklySeconds = dutyLogs
    .filter(s => s.discordUsername === discordUser?.username && s.timestamp >= weeklyStartTimestamp)
    .reduce((acc, curr) => acc + Number(curr.duration || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased text-sm selection:bg-amber-500 selection:text-slate-950">
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 border text-xs font-semibold tracking-wide shadow-2xl rounded-xl transition-all duration-300 ${toast.isError ? 'bg-red-950 border-red-500 text-red-200' : 'bg-slate-900 border-amber-400 text-amber-300'}`}>
          {toast.isError ? "ERROR: " : "SYSTEM: "}{toast.message}
        </div>
      )}

      {/* Header containing the Discord Auth control */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm relative z-40">
        <div className="flex items-center space-x-3">
          <BadgeIcon />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">Florida Highway Patrol</h2>
            <p className="text-[10px] text-slate-400 font-medium">FSRP CAD Patrol Terminal</p>
          </div>
        </div>

        {/* Discord Auth Widget */}
        <div className="relative">
          {discordUser ? (
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 bg-slate-950 border border-slate-800 hover:border-amber-400 transition px-3.5 py-1.5 rounded-xl outline-none"
              >
                <img 
                  src={discordUser.avatarUrl} 
                  alt={discordUser.username} 
                  className="w-6 h-6 rounded-full object-cover" 
                  onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${discordUser.username}` }}
                />
                <span className="font-semibold text-xs text-slate-200">{discordUser.username}</span>
                <span className="text-[10px] text-slate-500">▼</span>
              </button>

              {/* Logout Dropdown */}
              {showProfileDropdown && (
                <div className="absolute right-0 top-11 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50">
                  <button 
                    onClick={handleDiscordLogout}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setShowDiscordModal(true)}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold px-4 py-2 rounded-xl transition duration-150 flex items-center space-x-2 text-xs active:scale-95 shadow-md"
            >
              <span>Login with Discord</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-72 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
          <nav className="p-4 flex-1 space-y-1.5">
            <p className="px-2 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">TROOPER SHIFT</p>
            
            <button
              onClick={() => setActiveTab('duty')}
              className={`w-full flex items-center text-left px-4 py-3 rounded-xl font-medium tracking-wide transition duration-150 active:scale-[0.98] ${
                activeTab === 'duty' 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              <ClockIcon />
              Duty Active Shift
            </button>

            <button
              onClick={() => setActiveTab('dutyboard')}
              className={`w-full flex items-center text-left px-4 py-3 rounded-xl font-medium tracking-wide transition duration-150 active:scale-[0.98] ${
                activeTab === 'dutyboard' 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              <UsersIcon />
              Duty Board
            </button>

            <div className="py-1.5 border-t border-slate-800 my-4" />

            <p className="px-2 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">RECORDING FORMS</p>
            
            <button
              onClick={() => setActiveTab('arrest')}
              className={`w-full flex items-center text-left px-4 py-3 rounded-xl font-medium tracking-wide transition duration-150 active:scale-[0.98] ${
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

        {/* Content Panel */}
        <main className="flex-1 p-6 md:p-8 bg-slate-950">
          
          {/* DUTY ACTIVE SHIFT TAB */}
          {activeTab === 'duty' && (
            <div className="max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 bg-slate-950/60 border-b border-slate-800">
                <h2 className="text-base font-bold text-amber-400 uppercase tracking-wide">TROOPER ACTIVE DUTY SHIFT</h2>
                <p className="text-xs text-slate-400 mt-1">Start and stop your state patrol duty shifts. Weekly counters reset dynamically every Sunday.</p>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Authorization Guard Gate */}
                {!discordUser ? (
                  <div className="bg-slate-950 border border-slate-800 p-8 rounded-xl text-center space-y-4">
                    <div className="text-3xl">🛡️</div>
                    <h3 className="font-bold text-amber-400 uppercase tracking-wider text-sm">Discord Authentication Required</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      To begin an active FHP patrol shift, you must authorize your Discord account in the top-right corner.
                    </p>
                    <button 
                      onClick={() => setShowDiscordModal(true)}
                      className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold px-6 py-2.5 rounded-xl transition text-xs shadow-md"
                    >
                      Authenticate Now
                    </button>
                  </div>
                ) : !discordUser.roles.includes("1519891015224524871") ? (
                  <div className="bg-red-950/20 border border-red-500/20 p-8 rounded-xl text-center space-y-4">
                    <div className="text-3xl text-red-500">🚫</div>
                    <h3 className="font-bold text-red-400 uppercase tracking-wider text-sm">Role Verification Failed</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      You are logged in as <span className="font-bold text-slate-200">{discordUser.username}</span>, but you lack the required Role ID (<span className="font-mono bg-slate-950 px-1 py-0.5 rounded text-[11px] text-red-300">1519891015224524871</span>) to access the active duty terminal.
                    </p>
                    <p className="text-[11px] text-amber-500/90 font-semibold italic">
                      Tip: You can re-login and tick the "Verified Rank Role Presence" simulator checkbox to test.
                    </p>
                  </div>
                ) : (
                  // Active stopwatch terminal
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Active Status Display Card */}
                      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">TROOPER STATUS</p>
                          <p className={`text-xl font-bold mt-1 uppercase ${onDuty ? "text-emerald-400" : "text-slate-400"}`}>
                            {onDuty ? "● ACTIVE ON DUTY" : "○ OFF DUTY"}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-4">
                          Logged discord ID: <span className="font-mono text-slate-400">{discordUser.username}</span>
                        </p>
                      </div>

                      {/* Week Tally Card */}
                      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">WEEKLY PATROL TALLY</p>
                        <p className="text-2xl font-black text-amber-400 mt-1">
                          {Math.floor(myWeeklySeconds / 60)} <span className="text-xs font-semibold text-slate-400">minutes accumulated</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-3 font-semibold uppercase">
                          Sunday-to-Sunday Target: 60 minutes
                        </p>
                      </div>
                    </div>

                    {/* Stopwatch interface */}
                    <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl text-center space-y-4">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">CURRENT SHIFT SESSION TIMER</p>
                      <div className="text-5xl font-bold font-mono tracking-widest text-slate-100">
                        {onDuty ? formatStopwatch(elapsedSeconds) : "00:00:00"}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                        <button
                          disabled={onDuty}
                          onClick={handleStartShift}
                          className={`w-full sm:w-44 font-bold px-6 py-3 rounded-xl transition duration-150 ${
                            onDuty 
                              ? 'bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800' 
                              : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 active:scale-95 shadow-md shadow-emerald-500/5'
                          }`}
                        >
                          Start Shift
                        </button>
                        <button
                          disabled={!onDuty}
                          onClick={handleStopShift}
                          className={`w-full sm:w-44 font-bold px-6 py-3 rounded-xl transition duration-150 ${
                            !onDuty 
                              ? 'bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800' 
                              : 'bg-red-500 hover:bg-red-600 text-slate-50 active:scale-95 shadow-md shadow-red-500/5'
                          }`}
                        >
                          Stop Shift
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* SYSTEM DUTY BOARD DATABASE */}
          {activeTab === 'dutyboard' && (
            <div className="max-w-4xl space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
                <h2 className="text-base font-bold text-amber-400 uppercase tracking-wide">FHP PUBLIC DUTY BOARD</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Active roster tracking week-long shifts completed since last Sunday 00:00:00. Weekly target required to make shift count: <strong className="text-amber-400">60 active minutes</strong>.
                </p>
              </div>

              {/* Duty Board Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-4 gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-2">Trooper Discord Identity</div>
                  <div className="text-center">Total Time This Week</div>
                  <div className="text-right">Shift Passed</div>
                </div>

                <div className="divide-y divide-slate-800">
                  {weeklyBoardList.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500">
                      No troopers have logged any shifts during this Sunday session yet.
                    </div>
                  ) : (
                    weeklyBoardList.map((trooper, idx) => {
                      const totalMin = Math.floor(trooper.totalDuration / 60);
                      const madeIt = totalMin >= 60;

                      return (
                        <div key={idx} className="p-4 grid grid-cols-4 gap-2 items-center text-xs hover:bg-slate-950/20 transition">
                          <div className="col-span-2 flex items-center space-x-3">
                            <img 
                              src={trooper.avatarUrl} 
                              alt={trooper.username} 
                              className="w-8 h-8 rounded-full object-cover border border-slate-800"
                              onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${trooper.username}` }}
                            />
                            <span className="font-bold text-slate-100 text-sm">{trooper.username}</span>
                          </div>
                          <div className="text-center font-mono font-bold text-slate-200">
                            {totalMin} <span className="text-[10px] text-slate-500 font-sans font-normal">min</span>
                          </div>
                          <div className="text-right pr-2">
                            {madeIt ? (
                              <span className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg font-bold">
                                ✔️ Made It
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg font-bold">
                                ❌ Incomplete
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

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
                                          <span className="text-amber-400 font-bold">Story Account from:</span>
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

      {/* DISCORD SIMULATED OAUTH POPUP MODAL */}
      {showDiscordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">💬</span>
                <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Simulated Discord Login</h3>
              </div>
              <button 
                onClick={() => setShowDiscordModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                [Cancel]
              </button>
            </div>

            <form onSubmit={handleDiscordMockLogin} className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your Discord account to begin tracking patrol shifts. Enter your username below to simulate authorization.
              </p>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">Discord Username</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. state_trooper_99"
                  value={discordInputUser}
                  onChange={(e) => setDiscordInputUser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-400 outline-none text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">Custom Avatar URL (Optional)</label>
                <input 
                  type="url" 
                  placeholder="Link to profile image"
                  value={discordInputAvatar}
                  onChange={(e) => setDiscordInputAvatar(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-amber-400 outline-none text-slate-100 text-xs"
                />
              </div>

              {/* Role Checker Simulation switch */}
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-semibold cursor-pointer select-none" htmlFor="role-checkbox">
                    Verified Rank Role Presence
                  </label>
                  <input 
                    type="checkbox"
                    id="role-checkbox"
                    checked={hasVerifiedRole}
                    onChange={(e) => setHasVerifiedRole(e.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-800 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Toggle whether this Discord account holds the authorized Role ID (<span className="font-mono text-slate-400">1519891015224524871</span>) to begin active duties.
                </p>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-2.5 rounded-xl transition duration-150 text-xs shadow-md"
                >
                  Authorize CAD Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
