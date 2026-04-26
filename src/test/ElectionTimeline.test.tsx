import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ElectionTimeline } from '../components/ElectionTimeline';
import React from 'react';

describe('ElectionTimeline', () => {
  it('renders all election steps', () => {
    render(<ElectionTimeline currentStepIndex={0} />);
    
    // Check for some main titles
    expect(screen.getByText('Voter Registration')).toBeInTheDocument();
    expect(screen.getByText('Voter Verification')).toBeInTheDocument();
    expect(screen.getByText('Campaigning Period')).toBeInTheDocument();
  });

  it('highlights the active step', () => {
    render(<ElectionTimeline currentStepIndex={2} />); // Campaigning Period (index 2)
    
    const activeStep = screen.getByText('Campaigning Period');
    expect(activeStep).toHaveClass('text-ink');
    
    const inactiveStep = screen.getByText('Vote Counting');
    expect(inactiveStep).toHaveClass('text-ink/20');
  });

  it('has correct ARIA attributes for accessibility', () => {
    render(<ElectionTimeline currentStepIndex={0} />);
    const nav = screen.getByRole('navigation', { name: /election stages/i });
    expect(nav).toBeInTheDocument();
    
    // Check if at least one element has aria-current="step"
    const currentStep = document.querySelector('[aria-current="step"]');
    expect(currentStep).toBeInTheDocument();
    expect(currentStep).toHaveTextContent('Voter Registration');
  });
});
