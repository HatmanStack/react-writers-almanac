import { memo } from 'react';
import { sanitizeHtml, stripHtml } from '../utils';

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
      {(poemTitle ?? []).map((title, index) => (
        <div key={`${title}-${index}`}>
          <h2>
            <button
              type="button"
              className="text-4xl bg-transparent bg-no-repeat border-none cursor-pointer overflow-hidden font-bold text-app-text flex-[2_0_0] justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(poemTitle[index]),
              }}
              onClick={() => setSearchedTerm(poemTitle[index])}
              aria-label={`Search for poem: ${stripHtml(poemTitle[index])}`}
            />
          </h2>
          {poemTitle.length > 1 && author && author.length == 1 && index != 0 ? null : (
            <button
              type="button"
              className="text-2xl bg-transparent bg-no-repeat border-none cursor-pointer overflow-hidden font-bold text-app-text flex-[2_0_0] justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              onClick={() => {
                const authorName = author?.[index];
                if (authorName) setSearchedTerm(authorName);
              }}
              aria-label={
                author?.[index]
                  ? `Search for author: ${stripHtml(author?.[index])}`
                  : 'Search for author'
              }
            >
              by{' '}
              <span
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(author?.[index] ?? ''),
                }}
              />
            </button>
          )}
          <br />
          <br />
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(poem?.[index] ?? ''),
            }}
          />
          <br />
          <br />
          {index === poemTitle.length - 1 && poemByline && (
            <div
              className="text-sm italic text-app-text mt-2"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(poemByline),
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
});

export default Poem;
