import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Vote, Info, ShieldCheck, HelpCircle, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { ChatInterface } from './components/ChatInterface';
import { ElectionTimeline } from './components/ElectionTimeline';
import { ELECTION_STEPS } from './constants';
import { auth, googleProvider, db } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { detectStepFromText } from './lib/electionUtils';
import { logEngagementEvent } from './lib/firebase';

export default function App() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<'resources' | 'faq' | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const mainContentRef = React.useRef<HTMLElement>(null);

  // Focus management when modal or phase changes
  useEffect(() => {
    if (activeModal || currentStepIndex !== undefined) {
      mainContentRef.current?.focus();
    }
  }, [activeModal, currentStepIndex]);
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Load user progress from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentStepIndex(userDoc.data().currentStepIndex || 0);
        } else {
          // Initialize user in Firestore
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            currentStepIndex: 0,
            lastUpdated: serverTimestamp()
          });
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      setNotification({ message: 'Welcome back, Citizen!', type: 'success' });
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setNotification({ 
          message: 'Login popup was closed. Please allow popups and try again.', 
          type: 'error' 
        });
      } else if (error.code === 'auth/unauthorized-domain') {
        setNotification({ 
          message: 'This domain is not authorized in Firebase Console. Add this URL to Authorized Domains.', 
          type: 'error' 
        });
      } else {
        setNotification({ message: 'Authentication failed. Please try again.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentStepIndex(0);
      setNotification({ message: 'You have been logged out safely.', type: 'info' });
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Sync progress to Firestore
  const syncProgress = async (newIndex: number) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          currentStepIndex: newIndex,
          lastUpdated: serverTimestamp()
        });
        await logEngagementEvent('PHASE_CHANGE', { 
          from: currentStepIndex, 
          to: newIndex,
          stepName: ELECTION_STEPS[newIndex].title 
        });
      } catch (error) {
        console.error("Sync Error:", error);
      }
    }
  };

  const handleStepUpdate = (text: string) => {
    const bestStepIdx = detectStepFromText(text);

    if (bestStepIdx !== -1) {
      setCurrentStepIndex(bestStepIdx);
      syncProgress(bestStepIdx);
    }
  };

  const currentStep = ELECTION_STEPS[currentStepIndex];

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-accent selection:text-white flex flex-col relative">
      {/* Skip Link for A11y */}
      <a 
        href="#main-content" 
        className="absolute -top-10 left-0 bg-ink text-paper px-4 py-2 z-[200] focus:top-0 transition-all text-[10px] uppercase font-bold"
      >
        Skip to main content
      </a>

      {/* Editorial Header */}
      <header 
        id="main-header"
        className="w-full border-b border-ink/10 px-6 md:px-10 py-6 flex flex-col md:flex-row justify-between items-baseline gap-4"
        role="banner"
      >
        <div>
          <span className="tracking-extra-wide uppercase text-[10px] font-bold opacity-60">The Citizen's Mentorship Program</span>
          <h1 className="serif text-3xl font-black italic mt-1 leading-none">Matadaan Guide</h1>
        </div>
        <nav className="flex items-center gap-8 text-[11px] uppercase tracking-widest font-bold" aria-label="Main Navigation">
          <button 
            id="nav-guide"
            onClick={() => setActiveModal(null)}
            aria-current={!activeModal ? 'page' : undefined}
            className={`pb-1 transition-all ${!activeModal ? 'border-b-2 border-ink' : 'opacity-40 hover:opacity-100'}`}
          >
            Guide
          </button>
          <button 
            id="nav-resources"
            onClick={() => setActiveModal('resources')}
            aria-current={activeModal === 'resources' ? 'page' : undefined}
            className={`pb-1 transition-all ${activeModal === 'resources' ? 'border-b-2 border-ink' : 'opacity-40 hover:opacity-100'}`}
          >
            Resources
          </button>
          <button 
            id="nav-faq"
            onClick={() => setActiveModal('faq')}
            aria-current={activeModal === 'faq' ? 'page' : undefined}
            className={`pb-1 transition-all ${activeModal === 'faq' ? 'border-b-2 border-ink' : 'opacity-40 hover:opacity-100'}`}
          >
            FAQ
          </button>
          <div className="h-4 w-[1px] bg-ink/10 ml-2" aria-hidden="true" />
          {loading ? (
            <div className="w-6 h-6 border-2 border-ink/10 border-t-ink rounded-full animate-spin" aria-label="Authenticating" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-[8px] text-paper" aria-hidden="true">
                  {user.displayName?.[0] || 'U'}
                </div>
                <span className="hidden lg:inline text-[8px] opacity-40 sr-only">Logged in as </span>
                <span className="hidden lg:inline text-[8px] opacity-40">{user.displayName}</span>
              </div>
              <button 
                id="btn-logout"
                onClick={handleLogout}
                aria-label="Logout"
                className="opacity-40 hover:opacity-100 hover:text-accent transition-all flex items-center gap-1"
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button 
              id="btn-login"
              onClick={handleLogin}
              className="flex items-center gap-2 bg-ink text-paper px-4 py-1.5 hover:bg-accent transition-all focus-ring"
            >
              <LogIn size={12} />
              <span>Login</span>
            </button>
          )}
        </nav>
      </header>

      {/* Global Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 shadow-2xl border ${
              notification.type === 'error' ? 'bg-accent text-white border-accent/20' : 
              notification.type === 'success' ? 'bg-ink text-paper border-white/10' : 
              'bg-paper text-ink border-ink/10'
            }`}
          >
            <p className="text-[10px] uppercase tracking-widest font-black flex items-center gap-2">
              <Info size={12} />
              {notification.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <main 
        id="main-content"
        ref={mainContentRef}
        tabIndex={-1}
        className="flex-1 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] md:gap-16 p-6 md:p-10 overflow-hidden min-h-0 relative focus:outline-none"
      >
        <AnimatePresence mode="wait">
          {!activeModal ? (
            <motion.div 
              key="main-content"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="contents"
            >
              {/* Left Section: Active Phase & Chat */}
              <section className="flex flex-col h-full overflow-hidden" aria-labelledby="active-phase-title">
                <div className="relative mb-12 flex-shrink-0">
                  <span className="serif text-[120px] md:text-[140px] line-height-[0.8] opacity-10 absolute -top-8 -left-4 pointer-events-none select-none" aria-hidden="true">
                    {String(currentStepIndex + 1).padStart(2, '0')}
                  </span>
                  
                  <div className="relative z-10">
                    <span className="bg-ink text-paper px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                      Phase {currentStepIndex + 1}
                    </span>
                    <h2 id="active-phase-title" className="serif text-5xl md:text-7xl font-black mt-4 leading-none tracking-tightest">
                      {currentStep.title.split(' ').map((word, i) => (
                        <React.Fragment key={i}>
                          {word} {i === 0 && <br className="hidden md:block" />}
                        </React.Fragment>
                      ))}
                    </h2>
                    <p className="mt-4 text-lg md:text-xl serif italic text-ink/60 max-w-md">
                      “{currentStep.description}”
                    </p>
                  </div>
                </div>

                <div className="hidden lg:grid grid-cols-2 gap-8 mb-8 flex-shrink-0" aria-label="Quick statistics">
                  <div className="space-y-4">
                    <h4 className="uppercase text-[9px] font-bold tracking-[0.2em] border-b border-ink/10 pb-2">Quick Stats</h4>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-black serif italic text-accent leading-none">18+</div>
                      <div className="text-[10px] uppercase font-bold text-ink/40 tracking-wider">Eligible Age <br/>for registration</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="uppercase text-[9px] font-bold tracking-[0.2em] border-b border-ink/10 pb-2">Safety Tip</h4>
                    <p className="text-[10px] leading-relaxed font-medium text-ink/60">
                      Correct info is your shield against misinformation. Always verify via ECI portals.
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-h-0">
                  <ChatInterface onStepUpdate={handleStepUpdate} />
                </div>
              </section>

              {/* Right Section: Timeline & Rule */}
              <aside className="relative pl-0 md:pl-12 hidden md:flex flex-col h-full overflow-hidden" aria-labelledby="timeline-title">
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-ink/10" aria-hidden="true" />
                
                <div className="flex flex-col h-full">
                  <h3 id="timeline-title" className="uppercase text-[10px] font-bold tracking-[0.3em] text-center opacity-40 mb-12 flex-shrink-0">
                    The Election Lifecycle
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                    <ElectionTimeline currentStepIndex={currentStepIndex} />
                  </div>

                  <div className="mt-8 bg-ink/5 p-6 border border-ink/5 flex-shrink-0" role="complementary" aria-label="Safety Information">
                    <h4 className="serif italic font-bold text-lg mb-2">Misinformation Safety</h4>
                    <p className="text-xs leading-relaxed opacity-70">
                      Actually, you can vote even without a physical Voter ID card if your name is on the roll and you have a valid government-approved identity proof.
                    </p>
                  </div>
                </div>
              </aside>
            </motion.div>
          ) : activeModal === 'resources' ? (
            <motion.div 
              key="resources"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="col-span-1 md:col-span-2 overflow-y-auto custom-scrollbar pr-4 pb-20"
            >
              <div className="max-w-4xl mx-auto py-12">
                <span className="text-accent uppercase text-xs font-bold tracking-widest mb-4 block">Official Assets</span>
                <h2 className="serif text-6xl font-black mb-12 italic">Citizen's Toolbox</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <section>
                      <h4 className="uppercase text-[11px] font-bold tracking-[0.2em] border-b border-ink/10 pb-2 mb-4">Registration Portals</h4>
                      <ul className="space-y-4">
                        <li className="flex flex-col gap-1">
                          <a href="https://voters.eci.gov.in/" target="_blank" rel="noopener noreferrer" className="serif text-xl font-bold hover:text-accent transition-colors">ECI Voter Portal</a>
                          <p className="text-xs opacity-60">The primary gateway for Form 6, 7, and 8 submissions.</p>
                        </li>
                        <li className="flex flex-col gap-1">
                          <a href="https://voterportal.eci.gov.in/" target="_blank" rel="noopener noreferrer" className="serif text-xl font-bold hover:text-accent transition-colors">NVSP Service Portal</a>
                          <p className="text-xs opacity-60">Legacy portal still used for historical record verification.</p>
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="uppercase text-[11px] font-bold tracking-[0.2em] border-b border-ink/10 pb-2 mb-4">Mobile Applications</h4>
                      <ul className="space-y-4">
                        <li className="flex flex-col gap-1">
                          <span className="serif text-xl font-bold italic">Voter Helpline App</span>
                          <p className="text-xs opacity-60">Scan QR codes on Voter Slips and find your polling station.</p>
                        </li>
                        <li className="flex flex-col gap-1">
                          <span className="serif text-xl font-bold italic">cVIGIL</span>
                          <p className="text-xs opacity-60">Report model code of conduct violations in real-time.</p>
                        </li>
                      </ul>
                    </section>
                  </div>

                  <div className="bg-ink text-paper p-10 flex flex-col justify-between">
                     <div>
                       <span className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 block mb-6">Pro Tip</span>
                       <p className="serif text-2xl font-light italic leading-relaxed">
                         “Keep a clear scan of your Aadhar card and a passport-sized photo (under 2MB) ready before starting your online application.”
                       </p>
                     </div>
                     <div className="mt-12 flex items-center gap-4">
                       <span className="text-[10px] uppercase font-bold tracking-widest border border-white/20 px-3 py-1">Contact: 1950</span>
                       <span className="text-[10px] uppercase font-bold tracking-widest border border-white/20 px-3 py-1">ECI.GOV.IN</span>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="faq"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="col-span-1 md:col-span-2 overflow-y-auto custom-scrollbar pr-4 pb-20"
            >
              <div className="max-w-4xl mx-auto py-12">
                <span className="text-accent uppercase text-xs font-bold tracking-widest mb-4 block">Information Desk</span>
                <h2 className="serif text-6xl font-black mb-12 italic">Common Queries</h2>
                
                <div className="space-y-12">
                  {[
                    { q: "Can I vote if I don't have a Voter ID card?", a: "Yes, provided your name is in the Electoral Roll. You can use any of the 12 approved identity documents like Aadhar, Driving License, or Passport." },
                    { q: "What is NOTA?", a: "None of the Above (NOTA) is a ballot option that allows voters to officially register a vote of rejection for all candidates." },
                    { q: "How do I update my address in the voter list?", a: "You need to submit Form 8 on the ECI Voter Portal along with proof of your new residence." },
                    { q: "What happens if I make a mistake on the EVM?", a: "Once you press the button and the beep sounds, your vote is cast. Always check the VVPAT slip through the glass window to confirm your selection." }
                  ].map((item, idx) => (
                    <div key={idx} className="group border-b border-ink/10 pb-8">
                       <span className="serif text-accent text-3xl font-black mb-2 block">Q.</span>
                       <h4 className="serif text-2xl font-bold mb-4">{item.q}</h4>
                       <p className="text-sm leading-relaxed text-ink/70 max-w-2xl font-medium">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Editorial Footer */}
      <footer className="p-6 md:p-10 flex flex-col md:flex-row justify-between items-center bg-white border-t border-ink/10 gap-4" role="contentinfo">
        <div className="flex gap-8 text-[9px] uppercase tracking-widest font-black">
          <span className="text-ink">Election Commission of India</span>
          <span className="text-ink/60">Voter Helpline: 1950</span>
        </div>
        <div className="text-[9px] uppercase tracking-widest font-bold opacity-40">
          Designed for Citizens // No Political Bias // {new Date().getFullYear()} Edition
        </div>
      </footer>
    </div>
  );
}
