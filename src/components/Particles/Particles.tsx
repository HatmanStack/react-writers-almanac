import { useCallback, memo, useMemo } from 'react';
import { useWindowSize } from 'react-use';
import { loadSlim } from 'tsparticles-slim';
import type { Engine } from 'tsparticles-engine';
import Particles from 'react-particles';
import type { ParticlesOptions } from './types';

/**
 * Particles Component - Animated background particles effect
 *
 * Features:
 * - Interactive particle system using tsparticles
 * - Memoized for performance (expensive render)
 * - Responsive to user interactions (hover, click)
 * - Responsive to window size changes
 * - Custom blur/contrast animation
 *
 * Performance Note:
 * This component is wrapped in React.memo to prevent unnecessary re-renders
 * as particle rendering is computationally expensive.
 */
function ParticlesComponent() {
  const { width } = useWindowSize();

  /**
   * Initialize tsparticles engine with slim configuration
   * Uses loadSlim instead of loadFull to reduce bundle size
   */
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  /**
   * Particles configuration object - responsive to window size
   * Defines particle behavior, appearance, and interactivity
   * Adjusts particle count based on screen size for optimal performance
   */
  const particlesOptions: ParticlesOptions = useMemo(() => {
    // Reduce particle count on smaller screens for better performance
    const particleCount = width > 1000 ? 300 : 150;
    const densityArea = width > 1000 ? 1202.559045649142 : 800;

    return {
      particles: {
        number: {
          value: particleCount,
          density: {
            enable: true,
            value_area: densityArea,
          },
        },
        color: {
          value: '#000000',
        },
        shape: {
          type: 'polygon',
          stroke: {
            width: 0,
            color: '#000000',
          },
          polygon: {
            nb_sides: 10,
          },
          image: {
            src: 'img/github.svg',
            width: 100,
            height: 100,
          },
        },
        opacity: {
          value: 0.5,
          random: false,
          anim: {
            enable: false,
            speed: 6,
            opacity_min: 0.1,
            sync: false,
          },
        },
        size: {
          value: 24,
          random: true,
          anim: {
            enable: false,
            speed: 40,
            size_min: 0.1,
            sync: false,
          },
        },
        line_linked: {
          enable: true,
          distance: 150,
          color: '#f46300',
          opacity: 0.4,
          width: 1,
        },
        move: {
          enable: true,
          speed: 3,
          direction: 'none',
          random: false,
          straight: false,
          out_mode: 'out',
          bounce: false,
          attract: {
            enable: false,
            rotateX: 600,
            rotateY: 1200,
          },
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: {
            enable: true,
            mode: 'repulse',
          },
          onclick: {
            enable: true,
            mode: 'push',
          },
          resize: true,
        },
        modes: {
          grab: {
            distance: 400,
            line_linked: {
              opacity: 1,
            },
          },
          bubble: {
            distance: 400,
            size: 40,
            duration: 2,
            opacity: 8,
            speed: 3,
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
          push: {
            particles_nb: 4,
          },
          remove: {
            particles_nb: 2,
          },
        },
      },
      retina_detect: true,
    };
  }, [width]); // Recalculate when window width changes

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={particlesOptions}
      className="absolute w-full h-[200vh] bg-[#8f9193] bg-no-repeat bg-cover bg-center animate-particle-pulse"
      aria-hidden="true"
    />
  );
}

// Memoize component to prevent unnecessary re-renders
// Particles rendering is expensive, so we only want to render when props change
// Since this component has no props, it will only render once
export default memo(ParticlesComponent);
