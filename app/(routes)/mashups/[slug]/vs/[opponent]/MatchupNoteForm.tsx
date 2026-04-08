"use client";

import { useState, useTransition } from "react";
import { saveMatchupNoteAction } from "./actions";

export function MatchupNoteForm({
  championSlug,
  opponentSlug,
  initialBody,
}: {
  championSlug: string;
  opponentSlug: string;
  initialBody: string;
}) {
  const [body, setBody] = useState(initialBody);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  function save() {
    setMsg("");
    startTransition(async () => {
      const res = await saveMatchupNoteAction({ championSlug, opponentSlug, body });
      setMsg(
        res.ok
          ? "Guardado."
          : res.error
            ? `No se pudo guardar: ${res.error}`
            : "Error desconocido al guardar.",
      );
    });
  }

  return (
    <div className="space-y-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={12}
        className="w-full rounded-lg border border-purple-500/30 bg-[#1a0b2e] px-4 py-3 text-white placeholder:text-gray-500 focus:border-purple-400 focus:outline-none"
        placeholder="Cómo jugar este matchup, fases, runas, errores a evitar…"
      />
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="rounded-lg bg-purple-600 px-5 py-2 font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar nota"}
      </button>
      {msg && <p className="text-sm text-[#B8A9C9]">{msg}</p>}
    </div>
  );
}
