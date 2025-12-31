import { memo } from 'react';
import { sanitizeHtml, stripHtml } from '../utils';

interface PoemProps {
  poemTitle: string[] | undefined;
  poem: string[] | undefined;
  setSearchedTerm: (term: string) => void;
  author: string[] | undefined;
  poemByline: string | undefined;
  onTitleClick: (title: string, poemContent: string, authorName: string) => void;
  onAuthorClick: (authorName: string) => void;
}

const Poem = memo(function Poem({
  poemTitle,
  poem,
  author,
  poemByline,
  onTitleClick,
  onAuthorClick,
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
                __html: sanitizeHtml(poemTitle?.[index] ?? ''),
              }}
              onClick={() =>
                onTitleClick(
                  stripHtml(poemTitle?.[index] ?? ''),
                  poem?.[index] ?? '',
                  stripHtml(author?.[index] ?? '')
                )
              }
              aria-label={`View poem: ${stripHtml(poemTitle?.[index] ?? '')}`}
            />
          </h2>
          {poemTitle &&
          poemTitle.length > 1 &&
          author &&
          author.length == 1 &&
          index != 0 ? null : (
            <button
              type="button"
              className="text-2xl bg-transparent bg-no-repeat border-none cursor-pointer overflow-hidden font-bold text-app-text flex-[2_0_0] justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              onClick={() => {
                const authorName = author?.[index];
                if (authorName) onAuthorClick(stripHtml(authorName));
              }}
              aria-label={
                author?.[index]
                  ? `View author page: ${stripHtml(author?.[index])}`
                  : 'View author page'
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
          {poemTitle && index === poemTitle.length - 1 && poemByline && (
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
