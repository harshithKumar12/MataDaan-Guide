import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatInterface } from '../components/ChatInterface';
import * as geminiService from '../services/geminiService';
import React from 'react';

// Import mocks
import './firebaseMocks';

describe('ChatInterface Integration', () => {
  const mockOnStepUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the welcome message', async () => {
    render(<ChatInterface onStepUpdate={mockOnStepUpdate} />);
    expect(screen.getByText(/Namaste!/i)).toBeInTheDocument();
  });

  it('handles user message sends and AI response streaming', async () => {
    // Mock the streaming service with UNIQUE text
    const mockStream = (async function* () {
      yield 'Follow the instructions ';
      yield 'on the official NVSP portal.';
    })();
    vi.spyOn(geminiService, 'sendMessageStream').mockReturnValue(mockStream);

    render(<ChatInterface onStepUpdate={mockOnStepUpdate} />);
    
    const input = screen.getByPlaceholderText(/TYPE YOUR RESPONSE/i);
    const sendButton = screen.getByRole('button', { name: /SEND/i });

    fireEvent.change(input, { target: { value: 'How do I register?' } });
    fireEvent.click(sendButton);

    // AI thinking state
    expect(screen.getByText(/Assistant is thinking/i)).toBeInTheDocument();

    // Wait for the unique AI text
    await waitFor(() => {
      expect(screen.getByText(/Follow the instructions on the official NVSP portal/i)).toBeInTheDocument();
    });

    // Verify parent update was called
    expect(mockOnStepUpdate).toHaveBeenCalled();
  });

  it('handles network errors gracefully', async () => {
    vi.spyOn(geminiService, 'sendMessageStream').mockImplementation(async function* () {
      throw new Error('Network failure');
    });

    render(<ChatInterface onStepUpdate={mockOnStepUpdate} />);
    
    const input = screen.getByPlaceholderText(/TYPE YOUR RESPONSE/i);
    const sendButton = screen.getByRole('button', { name: /SEND/i });

    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      // Find the message by checking its container or role
      const errorMsg = screen.queryByText(/Network failure/i);
      expect(errorMsg).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('changes learning level when buttons are clicked', async () => {
    render(<ChatInterface onStepUpdate={mockOnStepUpdate} />);
    
    const advancedButton = screen.getByRole('button', { name: /ADVANCED/i });
    fireEvent.click(advancedButton);
    
    expect(advancedButton).toHaveAttribute('aria-pressed', 'true');
  });
});
