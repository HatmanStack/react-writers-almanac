import { useMemo, useEffect, memo } from 'react';
import type { AudioProps, NavigationDirection } from './types';
import { useAppStore } from '../../store/useAppStore';
import prev from '../../assets/prev.png';
import next from '../../assets/next.png';

/**
 * Navigation Button Component - Animated prev/next button with glowing border
 */
interface NavButtonProps {
  direction: NavigationDirection;
  imageSrc: string;
  altText: string;
  reverse?: boolean;
  onClick: (direction: NavigationDirection) => void;
}

function NavButton({ direction, imageSrc, altText, reverse = false, onClick }: NavButtonProps) {
  return (
    <div
      className={`scale-50 border-[0.35rem] border-transparent bg-app-container ${
        reverse ? 'animate-border-spin-reverse' : 'animate-border-spin'
      }`}
      style={{
        borderImage:
          'conic-gradient(from var(--angle), var(--c2) 0.05turn, var(--c1) 0.15turn, var(--c1) 0.25turn, var(--c2) 0.35turn) 30',
      }}
    >
      <button
        className="scale-[0.7] bg-app-container border-none"
        onClick={() => onClick(direction)}
        aria-label={`Navigate to ${direction === 'back' ? 'previous' : 'next'} content`}
      >
        <img className="ButtonImage" src={imageSrc} alt={altText} />
      </button>
    </div>
  );
}

/**
 * Audio Component - Handles audio playback, transcript display, and content navigation
 *
 * Features:
 * - Displays HTML5 audio player when MP3 is available
 * - Shows search term when in search mode
 * - Provides prev/next navigation with animated buttons
 * - Toggle transcript visibility
 * - Responsive design for desktop and mobile
 *
 * Performance:
 * - Wrapped in React.memo to prevent unnecessary re-renders
 * - Only re-renders when props change
 */
const Audio = memo(function Audio({
  isShowingContentbyDate,
  searchedTerm,
  shiftContentByAuthorOrDate,
  width,
  setIsShowing,
  isShowing,
}: AudioProps) {
  // Get MP3 URL from store
  const mp3Url = useAppStore(state => state.mp3Url);

  // Cleanup blob URLs when component unmounts or mp3Url changes to prevent memory leaks
  useEffect(() => {
    return () => {
      if (mp3Url && mp3Url.startsWith('blob:')) {
        URL.revokeObjectURL(mp3Url);
      }
    };
  }, [mp3Url]);

  // Memoize the heading content to prevent unnecessary re-renders
  const heading = useMemo(() => {
    const isAvailable = mp3Url && mp3Url !== 'NotAvailable';

    if (isShowingContentbyDate && isAvailable) {
      return (
        <div className="flex flex-col z-10">
          {width > 1000 ? (
            <div className="flex flex-col z-10">
              <audio
                className="min-w-[15em] justify-center mt-[1.1em] [&::-webkit-media-controls-panel]:bg-app-container"
                src={mp3Url}
                autoPlay={false}
                loop={false}
                controls
              />
              <button
                className="bg-transparent border-none cursor-pointer overflow-hidden outline-none font-bold text-xs text-app-container z-10"
                onClick={() => setIsShowing(!isShowing)}
                aria-label={`${isShowing ? 'Hide' : 'Show'} transcript`}
                aria-expanded={isShowing}
              >
                Transcript
              </button>
            </div>
          ) : (
            <div className="flex flex-col z-10">
              <div className="flex justify-center">
                <div className="flex-[1_0_auto]" />
                <audio
                  className="mt-[1.1em] justify-center [&::-webkit-media-controls-panel]:bg-app-container"
                  src={mp3Url}
                  autoPlay={false}
                  loop={false}
                  controls
                />
                <div className="flex-[1_0_auto]" />
              </div>
              <button
                className="bg-transparent border-none cursor-pointer overflow-hidden outline-none font-bold text-xs text-app-container z-10"
                onClick={() => setIsShowing(!isShowing)}
                aria-label={`${isShowing ? 'Hide' : 'Show'} transcript`}
                aria-expanded={isShowing}
              >
                Transcript
              </button>
            </div>
          )}
        </div>
      );
    } else if (!isShowingContentbyDate) {
      return (
        <div className="z-10 flex justify-center items-center bg-app-container rounded-[3rem] px-2">
          <h3>{searchedTerm}</h3>
        </div>
      );
    } else {
      return <div></div>;
    }
  }, [isShowingContentbyDate, mp3Url, width, isShowing, setIsShowing, searchedTerm]);

  return (
    <div>
      {width > 1000 ? (
        // Desktop layout
        <div>
          <div className="flex">
            <div className="flex-[1_0_auto]" />
            <div className="flex justify-center items-center">
              <NavButton
                direction="back"
                imageSrc={prev}
                altText="previous button"
                reverse={true}
                onClick={shiftContentByAuthorOrDate}
              />
            </div>
            {heading}
            <div className="flex justify-center items-center">
              <NavButton
                direction="forward"
                imageSrc={next}
                altText="next button"
                onClick={shiftContentByAuthorOrDate}
              />
            </div>
            <div className="flex-[1_0_auto]" />
          </div>
        </div>
      ) : (
        // Mobile layout
        <div>
          <div className="flex flex-col">
            <div className="flex-[1_0_auto]" />
            {heading}
            <div className="flex justify-center">
              <NavButton
                direction="back"
                imageSrc={prev}
                altText="previous button"
                reverse={true}
                onClick={shiftContentByAuthorOrDate}
              />
              <NavButton
                direction="forward"
                imageSrc={next}
                altText="next button"
                onClick={shiftContentByAuthorOrDate}
              />
            </div>
            <div className="flex-[1_0_auto]" />
          </div>
        </div>
      )}
    </div>
  );
});

export default Audio;
