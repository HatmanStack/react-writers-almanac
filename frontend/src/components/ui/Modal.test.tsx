import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal Component', () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    title: 'Test Modal',
    children: <div>Test Content</div>,
  };

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render title', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
    });
  });

  describe('Close Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking outside modal content', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      await user.click(dialog);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when clicking inside modal content', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);

      const content = screen.getByText('Test Content');
      await user.click(content);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should trap focus with Tab key (forward)', async () => {
      const user = userEvent.setup();
      render(
        <Modal {...defaultProps}>
          <button>First</button>
          <button>Last</button>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      const modalContent = within(dialog);
      const closeButton = modalContent.getByRole('button', { name: /close modal/i });
      const lastButton = modalContent.getByRole('button', { name: 'Last' });

      // Focus last button
      lastButton.focus();
      expect(lastButton).toHaveFocus();

      // Tab should wrap to first focusable element
      await user.keyboard('{Tab}');

      // After tab from last element, focus should be on first focusable element
      expect(closeButton).toHaveFocus();
    });

    it('should trap focus with Shift+Tab key (backward)', async () => {
      const user = userEvent.setup();
      render(
        <Modal {...defaultProps}>
          <button>First</button>
          <button>Last</button>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      const modalContent = within(dialog);
      const closeButton = modalContent.getByRole('button', { name: /close modal/i });
      const lastButton = modalContent.getByRole('button', { name: 'Last' });

      // Focus close button (first focusable element)
      closeButton.focus();
      expect(closeButton).toHaveFocus();

      // Shift+Tab should wrap to last focusable element
      await user.keyboard('{Shift>}{Tab}{/Shift}');

      // After shift+tab from first element, focus should be on last element
      expect(lastButton).toHaveFocus();
    });
  });

  describe('Focus Management', () => {
    it('should focus modal when opened', () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={false} />);

      const button = document.createElement('button');
      button.textContent = 'Outside Button';
      document.body.appendChild(button);
      button.focus();

      rerender(<Modal {...defaultProps} isOpen={true} />);

      // Modal or its content should receive focus
      const dialog = screen.getByRole('dialog');
      expect(dialog.contains(document.activeElement)).toBe(true);

      document.body.removeChild(button);
    });

    it('should restore focus to last active element when closed', () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={false} />);

      const button = document.createElement('button');
      button.textContent = 'Outside Button';
      document.body.appendChild(button);
      button.focus();

      expect(button).toHaveFocus();

      rerender(<Modal {...defaultProps} isOpen={true} />);
      rerender(<Modal {...defaultProps} isOpen={false} />);

      // Focus should return to button
      expect(button).toHaveFocus();

      document.body.removeChild(button);
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should have correctly associated title', () => {
      render(<Modal {...defaultProps} title="Accessibility Test" />);

      const title = screen.getByText('Accessibility Test');
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    it('should have accessible close button label', () => {
      render(<Modal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should remove event listeners when unmounted', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(<Modal {...defaultProps} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should remove event listeners when isOpen changes to false', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { rerender } = render(<Modal {...defaultProps} isOpen={true} />);

      rerender(<Modal {...defaultProps} isOpen={false} />);

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children', () => {
      render(<Modal {...defaultProps}>{null}</Modal>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle empty title', () => {
      render(<Modal {...defaultProps} title="" />);
      const title = document.getElementById('modal-title');
      expect(title).toBeInTheDocument();
    });

    it('should handle rapid open/close toggles', () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={false} />);

      // Rapidly toggle
      rerender(<Modal {...defaultProps} isOpen={true} />);
      rerender(<Modal {...defaultProps} isOpen={false} />);
      rerender(<Modal {...defaultProps} isOpen={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
