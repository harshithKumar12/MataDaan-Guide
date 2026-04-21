import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Vote, Info, ShieldCheck, HelpCircle } from 'lucide-react';
import { ChatInterface } from './components/ChatInterface';
import { ElectionTimeline } from './components/ElectionTimeline';
import { ELECTION_STEPS } from './constants';

export default function App() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<'resources' | 'faq' | null>(null);

  // Refined heuristic for step detection
  const handleStepUpdate = (text: string) => {
    const lowerText = text.toLowerCase();
    const weights: Record<string, number> = {};

    ELECTION_STEPS.forEach((step, index) => {
      const keywords = {
        registration: ['register', 'voter id', 'form 6', 'electoral roll', 'apply', 'enroll'],
        verification: ['verify', 'check name', 'nvsp', 'blo', 'search name', 'electoral search'],
        campaigning: ['campaign', 'manifesto', 'candidate', 'party', 'rally', 'promises'],
        voting: ['vote', 'evm', 'polling', 'booth', 'ink', 'vvpat', 'slip'],
        counting: ['count', 'tally', 'machine', 'strong room', 'observer'],
        results: ['result', 'winner', 'declared', 'victory', 'majority']
      }[step.id] || [];

      let score = 0;
      keywords.forEach(k => {
        if (lowerText.includes(k)) score += 1;
      });
      weights[step.id] = score;
    });

    // Find step with highest score
    let bestStepIdx = -1;
    let maxScore = 0;
    
    // Iterate in reverse to prefer later stages if scores are equal
    for (let i = ELECTION_STEPS.length - 1; i >= 0; i--) {
      if (weights[ELECTION_STEPS[i].id] > maxScore) {
        maxScore = weights[ELECTION_STEPS[i].id];
        bestStepIdx = i;
      }
    }

    if (bestStepIdx !== -1 && maxScore > 0) {
      setCurrentStepIndex(bestStepIdx);
    }
  };

  const currentStep = ELECTION_STEPS[currentStepIndex];

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-accent selection:text-white flex flex-col relative">
      {/* Editorial Header */}
      <header className="w-full border-b border-ink/10 px-6 md:px-10 py-6 flex flex-col md:flex-row justify-between items-baseline gap-4">
        <div>
          <span className="tracking-extra-wide uppercase text-[10px] font-bold opacity-60">The Citizen's Mentorship Program</span>
          <h1 className="serif text-3xl font-black italic mt-1 leading-none">Matadaan Guide</h1>
        </div>
        <div className="flex gap-8 text-[11px] uppercase tracking-widest font-bold">
          <button 
            onClick={() => setActiveModal(null)}
            className={`pb-1 transition-all ${!activeModal ? 'border-b-2 border-ink' : 'opacity-40 hover:opacity-100'}`}
          >
            Guide
          </button>
          <button 
            onClick={() => setActiveModal('resources')}
            className={`pb-1 transition-all ${activeModal === 'resources' ? 'border-b-2 border-ink' : 'opacity-40 hover:opacity-100'}`}
          >
            Resources
          </button>
          <button 
            onClick={() => setActiveModal('faq')}
            className={`pb-1 transition-all ${activeModal === 'faq' ? 'border-b-2 border-ink' : 'opacity-40 hover:opacity-100'}`}
          >
            FAQ
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] md:gap-16 p-6 md:p-10 overflow-hidden min-h-0 relative">
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
              <section className="flex flex-col h-full overflow-hidden">
                <div className="relative mb-12 flex-shrink-0">
                  <span className="serif text-[120px] md:text-[140px] line-height-[0.8] opacity-10 absolute -top-8 -left-4 pointer-events-none select-none">
                    {String(currentStepIndex + 1).padStart(2, '0')}
                  </span>
                  
                  <div className="relative z-10">
                    <span className="bg-ink text-paper px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                      Phase {currentStepIndex + 1}
                    </span>
                    <h2 className="serif text-5xl md:text-7xl font-black mt-4 leading-none tracking-tightest">
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

                <div className="hidden lg:grid grid-cols-2 gap-8 mb-8 flex-shrink-0">
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
              <section className="relative pl-0 md:pl-12 hidden md:flex flex-col h-full overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-ink/10" />
                
                <div className="flex flex-col h-full">
                  <h3 className="uppercase text-[10px] font-bold tracking-[0.3em] text-center opacity-40 mb-12 flex-shrink-0">
                    The Election Lifecycle
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                    <ElectionTimeline currentStepIndex={currentStepIndex} />
                  </div>

                  <div className="mt-8 bg-ink/5 p-6 border border-ink/5 flex-shrink-0">
                    <h4 className="serif italic font-bold text-lg mb-2">Misinformation Safety</h4>
                    <p className="text-xs leading-relaxed opacity-70">
                      Actually, you can vote even without a physical Voter ID card if your name is on the roll and you have a valid government-approved identity proof.
                    </p>
                  </div>
                </div>
              </section>
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
      <footer className="p-6 md:p-10 flex flex-col md:flex-row justify-between items-center bg-white border-t border-ink/10 gap-4">
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
