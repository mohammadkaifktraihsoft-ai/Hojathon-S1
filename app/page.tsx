import { AgentPanel } from "@/components/AgentPanel";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl gap-8 px-6 py-16">
      <div className="flex-1">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Care follow-up</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-slate-900">Foundation ready for the follow-up workspace.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Product modules will be implemented on top of the shared Next.js, Supabase, Gemini, and shadcn foundation.</p>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
          <strong>Testing layout:</strong> Agent panel is on the right.
        </p>
      </div>
      <div className="w-[400px]">
        <AgentPanel />
      </div>
    </main>
  );
}
