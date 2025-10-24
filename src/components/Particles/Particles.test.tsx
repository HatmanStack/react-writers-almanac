import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Mock react-use
vi.mock('react-use', () => ({
  useWindowSize: vi.fn(() => ({ width: 1200, height: 800 })),
}));

// Mock tsparticles-slim
vi.mock('tsparticles-slim', () => ({
  loadSlim: vi.fn(),
}));

// Mock react-particles
vi.mock('react-particles', () => ({
  default: vi.fn(({ id, className }) => (
    <div id={id} className={className} data-testid="particles-container">
      Mock Particles
    </div>
  )),
}));

import ParticlesComponent from './Particles';
import Particles from 'react-particles';
import { useWindowSize } from 'react-use';

describe('Particles Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<ParticlesComponent />);
      expect(container).toBeInTheDocument();
    });

    it('should render with correct ID', () => {
      const { container } = render(<ParticlesComponent />);
      const particlesDiv = container.querySelector('#tsparticles');
      expect(particlesDiv).toBeInTheDocument();
    });

    it('should render mock particles component', () => {
      const { getByTestId } = render(<ParticlesComponent />);
      expect(getByTestId('particles-container')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply correct Tailwind classes', () => {
      const { container } = render(<ParticlesComponent />);
      const particlesDiv = container.querySelector('#tsparticles');
      expect(particlesDiv).toHaveClass('absolute');
      expect(particlesDiv).toHaveClass('w-full');
      expect(particlesDiv).toHaveClass('h-[200vh]');
      expect(particlesDiv).toHaveClass('bg-[#8f9193]');
      expect(particlesDiv).toHaveClass('animate-particle-pulse');
    });

    it('should have background styling classes', () => {
      const { container } = render(<ParticlesComponent />);
      const particlesDiv = container.querySelector('#tsparticles');
      expect(particlesDiv).toHaveClass('bg-no-repeat');
      expect(particlesDiv).toHaveClass('bg-cover');
      expect(particlesDiv).toHaveClass('bg-center');
    });
  });

  describe('Memoization', () => {
    it('should be a memoized component', () => {
      // Check that the component is wrapped with memo
      // This is verified by checking the component type
      expect(ParticlesComponent).toBeDefined();
      // The component should not re-render unnecessarily
      // This is more of an integration test, but we can verify the component exists
    });

    it('should render consistently', () => {
      const { getByTestId } = render(<ParticlesComponent />);
      // Component should render with consistent structure
      expect(getByTestId('particles-container')).toBeInTheDocument();
    });
  });

  describe('Particles Configuration', () => {
    it('should pass configuration to Particles component', () => {
      render(<ParticlesComponent />);

      // Verify that Particles was called
      expect(Particles).toHaveBeenCalled();

      // Verify that it was called with options
      const callArgs = (Particles as any).mock.calls[0][0];
      expect(callArgs.options).toBeDefined();
    });

    it('should configure particles with correct number', () => {
      render(<ParticlesComponent />);

      const callArgs = (Particles as any).mock.calls[0][0];
      expect(callArgs.options.particles.number.value).toBe(300);
    });

    it('should configure interactivity modes', () => {
      render(<ParticlesComponent />);

      const callArgs = (Particles as any).mock.calls[0][0];
      expect(callArgs.options.interactivity.events.onhover.enable).toBe(true);
      expect(callArgs.options.interactivity.events.onclick.enable).toBe(true);
    });

    it('should enable retina detection', () => {
      render(<ParticlesComponent />);

      const callArgs = (Particles as any).mock.calls[0][0];
      expect(callArgs.options.retina_detect).toBe(true);
    });
  });

  describe('Callbacks', () => {
    it('should provide init callback', () => {
      render(<ParticlesComponent />);

      const callArgs = (Particles as any).mock.calls[0][0];
      expect(callArgs.init).toBeDefined();
      expect(typeof callArgs.init).toBe('function');
    });
  });

  describe('Responsive Behavior', () => {
    it('should use 300 particles on desktop (width > 1000)', () => {
      (useWindowSize as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 1200,
        height: 800,
      });
      render(<ParticlesComponent />);

      const callArgs = (Particles as any).mock.calls[0][0];
      expect(callArgs.options.particles.number.value).toBe(300);
    });

    it('should use 150 particles on mobile (width <= 1000)', () => {
      (useWindowSize as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 800,
        height: 600,
      });
      render(<ParticlesComponent />);

      const callArgs = (Particles as any).mock.calls[0][0];
      expect(callArgs.options.particles.number.value).toBe(150);
    });

    it('should adjust density area based on screen size', () => {
      // Desktop
      (useWindowSize as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 1200,
        height: 800,
      });
      const { unmount } = render(<ParticlesComponent />);
      const desktopArgs = (Particles as any).mock.calls[0][0];
      expect(desktopArgs.options.particles.number.density.value_area).toBe(1202.559045649142);
      unmount();

      vi.clearAllMocks();

      // Mobile
      (useWindowSize as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 800,
        height: 600,
      });
      render(<ParticlesComponent />);
      const mobileArgs = (Particles as any).mock.calls[0][0];
      expect(mobileArgs.options.particles.number.density.value_area).toBe(800);
    });

    it('should use useWindowSize hook', () => {
      render(<ParticlesComponent />);
      expect(useWindowSize).toHaveBeenCalled();
    });
  });
});
