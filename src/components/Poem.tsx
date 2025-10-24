import { memo } from 'react';
import DOMPurify from 'dompurify';

interface PoemProps {
  poemTitle: string[] | undefined;
  poem: string[] | undefined;
  setSearchedTerm: (term: string) => void;
  author: string[] | undefined;
  poemByline: string | undefined;
}

const Poem = memo(function Poem({
  poemTitle,
  poem,
  setSearchedTerm,
  author,
  poemByline,
}: PoemProps) {
  return (
    <div>
      {poemTitle &&
        poemTitle.map((_, index) => (
          <div key={index}>
            <h2>
              <button
                className="text-base bg-transparent bg-no-repeat border-none cursor-pointer overflow-hidden outline-none font-bold text-app-text flex-[2_0_0] justify-center"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(poemTitle[index]).replaceAll(/[^\x20-\x7E]/g, ''),
                }}
                onClick={() => setSearchedTerm(poemTitle[index])}
                aria-label={`Search for poem: ${poemTitle[index]}`}
              />
            </h2>
            {poemTitle.length > 1 && author && author.length == 1 && index != 0 ? null : (
              <button
                className="bg-transparent bg-no-repeat border-none cursor-pointer overflow-hidden outline-none font-bold text-base text-app-text flex-[2_0_0] justify-center"
                onClick={() => author && setSearchedTerm(author[index])}
                aria-label={author ? `Search for author: ${author[index]}` : 'Search for author'}
              >
                by{' '}
                <span
                  dangerouslySetInnerHTML={{
                    __html:
                      (author &&
                        DOMPurify.sanitize(author[index]).replaceAll(/[^\x20-\x7E]/g, '')) ||
                      '',
                  }}
                />
              </button>
            )}
            <br />
            <br />
            <div
              dangerouslySetInnerHTML={{
                __html:
                  (poem && DOMPurify.sanitize(poem[index]).replaceAll(/[^\x20-\x7E]/g, '')) || '',
              }}
            />
            <br />
            <br />
            {index === poemTitle.length - 1 && poemByline && (
              <div
                className="text-sm italic text-app-text mt-2"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(poemByline).replaceAll(/[^\x20-\x7E]/g, ''),
                }}
              />
            )}
          </div>
        ))}
    </div>
  );
});

export default Poem;
