'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

type Placeholder = { token: string; rule: string }

export function TemplateEditor({ templates, placeholders, counts }: {
  templates: Record<string, string>
  placeholders: readonly Placeholder[]
  counts: Record<string, number>
}) {
  const router = useRouter()
  const jobs = Object.keys(templates)
  const [job, setJob] = useState(jobs[0] ?? '')
  const [drafts, setDrafts] = useState(templates)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const box = useRef<HTMLTextAreaElement>(null)

  const insert = (token: string) => {
    const el = box.current
    const text = drafts[job] ?? ''
    const at = el?.selectionStart ?? text.length
    setDrafts(d => ({ ...d, [job]: text.slice(0, at) + token + text.slice(el?.selectionEnd ?? at) }))
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(at + token.length, at + token.length) })
  }

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/templates', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ [job]: drafts[job] }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()   // rebuild every draft below with the new wording
    } finally {
      setSaving(false)
    }
  }

  const dirty = drafts[job] !== templates[job]

  return (
    <details className="rounded-2xl border bg-surface-2 mb-8" style={{ borderColor: 'var(--border)' }}>
      <summary className="cursor-pointer list-none p-5 flex items-center gap-3 flex-wrap">
        <span className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">
          Your reply templates
        </span>
        <span className="text-sm text-ink-2">
          {jobs.length} questions answer themselves. Change the wording here.
        </span>
        <span className="ml-auto text-xs text-ink-3">open</span>
      </summary>

      <div className="px-5 pb-5 border-t pt-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap gap-2 mb-4">
          {jobs.map(j => (
            <button
              key={j} type="button" onClick={() => setJob(j)}
              className="text-xs rounded-lg border px-2.5 py-1.5 transition-colors"
              style={{
                borderColor: job === j ? 'var(--accent)' : 'var(--border)',
                background: job === j ? 'var(--accent)' : 'transparent',
                color: job === j ? '#fff' : 'inherit',
              }}
            >
              {j.toLowerCase()}
              {counts[j] ? <span className="opacity-70 ml-1.5 tnum">{counts[j]}</span> : null}
            </button>
          ))}
        </div>

        <textarea
          ref={box}
          value={drafts[job] ?? ''}
          onChange={e => setDrafts(d => ({ ...d, [job]: e.target.value }))}
          rows={4}
          className="w-full rounded-lg border p-3 text-sm leading-relaxed bg-background text-foreground"
          style={{ borderColor: 'var(--border)' }}
        />

        <div className="flex flex-wrap gap-1.5 mt-3">
          {placeholders.map(p => (
            <button
              key={p.token} type="button" onClick={() => insert(p.token)}
              title={p.rule}
              className="text-[11px] rounded-md border px-2 py-1 font-mono hover:bg-background transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              {p.token}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <button
            type="button" onClick={save} disabled={saving || !dirty}
            className="text-xs rounded-lg px-3 py-2 font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save and rewrite the drafts'}
          </button>
          {dirty && !saving && <span className="text-xs text-ink-3">unsaved</span>}
          <button
            type="button"
            onClick={() => setDrafts(d => ({ ...d, [job]: templates[job] }))}
            className="text-xs rounded-lg border px-3 py-2 hover:bg-background transition-colors ml-auto"
            style={{ borderColor: 'var(--border)' }}
          >
            Undo
          </button>
        </div>

        <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--background)' }}>
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-2">
            How each part is filled in
          </p>
          <dl className="space-y-1.5">
            {placeholders.map(p => (
              <div key={p.token} className="flex gap-3 text-xs">
                <dt className="font-mono shrink-0 w-32" style={{ color: 'var(--accent)' }}>{p.token}</dt>
                <dd className="text-ink-2">{p.rule}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-ink-3 mt-3 leading-relaxed">
            Which affiliate link goes in: the piece they asked about. For a budget
            question, the cheaper piece of the same kind. If no cheaper one exists, the
            message goes to you instead of guessing.
          </p>
        </div>
      </div>
    </details>
  )
}
