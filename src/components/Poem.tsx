import { memo } from 'react';
import { sanitizeHtml } from '../utils';
import { useAppStore } from '../store/useAppStore';

interface PoemProps {
  poemTitle: string[] | undefined;
  poem: string[] | undefined;
  author: string[] | undefined;
  poemByline: string | undefined;
}

const Poem = memo(function Poem({ poemTitle, poem, author, poemByline }: PoemProps) {
  const { setPoemModalOpen, setSelectedPoem, setAuthorPageOpen, setSelectedAuthor } = useAppStore();
  return (
    <div>
      {poemTitle &&
        poemTitle.map((title, index) => (
          <div key={`${title}-${index}`}>
            <h2>
              <button
                type="button"
                className="text-3xl bg-transparent bg-no-repeat border-none cursor-pointer overflow-hidden font-bold text-app-text flex-[2_0_0] justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(poemTitle[index]),
                }}
                onClick={() => {
                  setSelectedPoem(poemTitle[index]);
                  setPoemModalOpen(true);
                }}
                aria-label={`Search for poem: ${poemTitle[index]}`}
              />
            </h2>
            {poemTitle.length > 1 && author && author.length == 1 && index != 0 ? null : (
              <button
                type="button"
                className="bg-transparent bg-no-repeat border-none cursor-pointer overflow-hidden font-bold text-xl text-app-text flex-[2_0_0] justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                onClick={() => {
                  const authorName = author?.[index];
                  if (authorName) {
                    setSelectedAuthor(authorName);
                    setAuthorPageOpen(true);
                  }
                }}
                aria-label={
                  author?.[index] ? `Search for author: ${author?.[index]}` : 'Search for author'
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
                className="text-base italic text-app-text mt-2"
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
