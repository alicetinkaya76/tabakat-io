export default function Loading({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-5">
      <div className="relative">
        <div className="w-10 h-10 border-2 border-sand-200 dark:border-ink-700 rounded-full" />
        <div className="absolute inset-0 w-10 h-10 border-2 border-transparent border-t-gold-500 rounded-full animate-spin" />
      </div>
      {text && (
        <p className="text-sm text-ink-400 dark:text-sand-500 font-medium">{text}…</p>
      )}
    </div>
  );
}
