import { memo } from 'react';
import { sanitizeHtml } from '../utils';

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
                className="text-base bg-transparent bg-no-repeat border-none cursor-pointer overflow-hidden font-bold text-app-text flex-[2_0_0] justify-center focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(poemTitle[index], true),
                }}
                onClick={() => setSearchedTerm(poemTitle[index])}
                aria-label={`Search for poem: ${poemTitle[index]}`}
              />
            </h2>
            {poemTitle.length > 1 && author && author.length == 1 && index != 0 ? null : (
              <button
                className="bg-transparent bg-no-repeat border-none cursor-pointer overflow-hidden font-bold text-base text-app-text flex-[2_0_0] justify-center focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                onClick={() => author && setSearchedTerm(author[index])}
                aria-label={author ? `Search for author: ${author[index]}` : 'Search for author'}
              >
                by{' '}
                <span
                  dangerouslySetInnerHTML={{
                    __html: (author && sanitizeHtml(author[index], true)) || '',
                  }}
                />
              </button>
            )}
            <br />
            <br />
            <div
              dangerouslySetInnerHTML={{
                __html: (poem && sanitizeHtml(poem[index], true)) || '',
              }}
            />
            <br />
            <br />
            {index === poemTitle.length - 1 && poemByline && (
              <div
                className="text-sm italic text-app-text mt-2"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(poemByline, true),
                }}
              />
            )}
          </div>
        ))}
    </div>
  );
});

export default Poem;
