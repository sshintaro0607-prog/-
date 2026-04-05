type Note = { id: string; content: string };

export default function StandingNotesDisplay({ notes }: { notes: Note[] }) {
  if (notes.length === 0) return null;

  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-amber-800 mb-2">固定引継事項</h3>
      <ul className="space-y-1">
        {notes.map((note) => (
          <li key={note.id} className="text-sm text-amber-900 flex gap-2">
            <span className="shrink-0 mt-0.5">・</span>
            <span className="whitespace-pre-wrap">{note.content}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
