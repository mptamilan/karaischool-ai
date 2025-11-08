import { Link } from "react-router-dom";

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-16">
      <div className="glass rounded-3xl p-8 text-center">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="mt-2 text-slate-600">This page is coming soon. Continue in the chat to specify what you'd like here.</p>
        <div className="mt-6">
          <Link to="/" className="btn-primary">Go back Home</Link>
        </div>
      </div>
    </div>
  );
}
