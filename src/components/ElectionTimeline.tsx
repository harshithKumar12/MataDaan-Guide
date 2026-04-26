import React from 'react';
import { motion } from 'motion/react';
import { ELECTION_STEPS } from '../constants';
import { UserPlus, Search, Megaphone, Vote, Calculator, Trophy, LucideIcon } from 'lucide-react';

const IconMap: Record<string, LucideIcon> = {
  UserPlus,
  Search,
  Megaphone,
  Vote,
  Calculator,
  Trophy
};

interface ElectionTimelineProps {
  currentStepIndex: number;
}

export const ElectionTimeline: React.FC<ElectionTimelineProps> = ({ currentStepIndex }) => {
  return (
    <nav className="flex flex-col space-y-16" aria-label="Election Stages">
      {ELECTION_STEPS.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;

        return (
          <motion.div 
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isActive || isCompleted ? 1 : 0.3, x: 0 }}
            className="flex items-start gap-8 group cursor-default"
            aria-current={isActive ? 'step' : undefined}
          >
            <div 
              aria-hidden="true"
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-[10px] border-2 transition-all duration-500 flex-shrink-0 mt-1 ${
                isActive ? 'bg-ink text-paper border-ink ring-4 ring-ink/5' : 
                isCompleted ? 'bg-accent text-paper border-accent' : 
                'bg-transparent text-ink border-ink opacity-30 group-hover:opacity-100'
              }`}
            >
              {index + 1}
            </div>
            
            <div className="flex-1">
              <h4 className={`serif text-4xl font-extrabold italic transition-all duration-500 tracking-tightest ${
                isActive ? 'text-ink' : 'text-ink/20'
              }`}>
                {step.title}
              </h4>
              {isActive && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-xs font-medium leading-relaxed opacity-60 max-w-[200px]"
                >
                  <span className="sr-only">Step details: </span>
                  {step.description}
                </motion.p>
              )}
              {isCompleted && <span className="sr-only">(Completed)</span>}
            </div>
          </motion.div>
        );
      })}
    </nav>
  );
};

const HelpCircle = (props: any) => <Search {...props} />; // Fallback
