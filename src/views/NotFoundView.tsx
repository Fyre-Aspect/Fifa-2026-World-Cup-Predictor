import { Link } from 'react-router-dom';

export function NotFoundView() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="display-num text-7xl font-700 text-gold-400">404</p>
      <h1 className="mt-3 font-display text-2xl font-600 text-offwhite">Off the pitch</h1>
      <p className="mt-2 text-offwhite-dim">
        That route doesn&rsquo;t exist. Let&rsquo;s get you back in play.
      </p>
      <Link
        to="/"
        className="interactive mt-6 rounded-lg bg-gold-400 px-5 py-3 text-sm font-600 text-pitch-950 shadow-glow hover:bg-gold-300"
      >
        Back to the globe
      </Link>
    </div>
  );
}
