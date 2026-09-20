'use client'

/**
 * A mock-up of what the reply looks like when it lands. Deliberately generic
 * phone chrome rather than a copy of Instagram's — it is here to show the shape
 * of the conversation, not to pass for the real app.
 */

export type Bubble = { from: 'them' | 'you'; text: string; link?: string; linkLabel?: string }

function LinkCard({ label, href }: { label: string; href: string }) {
  return (
    <span className="block mt-2 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.16)' }}>
      <span className="block px-2.5 py-2">
        <span className="block text-[11px] opacity-80 truncate">{new URL(href, 'http://x').host || 'link'}</span>
        <span className="block text-xs font-medium truncate">{label}</span>
      </span>
    </span>
  )
}

export function DmPreview({ handle, bubbles, caption }: {
  handle: string; bubbles: Bubble[]; caption?: string
}) {
  return (
    <div>
      {caption && (
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-2">{caption}</p>
      )}
      <div className="rounded-[1.75rem] border p-2.5 max-w-[20rem]"
           style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
        <div className="rounded-[1.4rem] overflow-hidden" style={{ background: 'var(--background)' }}>

          <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="size-6 rounded-full shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--seg-5), var(--seg-4))' }} />
            <span className="text-xs font-medium truncate">{handle}</span>
            <span className="ml-auto text-[10px] text-ink-3">Instagram</span>
          </div>

          <div className="p-3 space-y-2 min-h-[7rem]">
            {bubbles.map((b, i) => (
              <div key={i} className={`flex ${b.from === 'you' ? 'justify-end' : 'justify-start'}`}>
                <span
                  className="inline-block max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words"
                  style={
                    b.from === 'you'
                      ? { background: 'var(--accent)', color: '#fff' }
                      : { background: 'var(--grid)', color: 'var(--foreground)' }
                  }
                >
                  {b.text}
                  {b.link && <LinkCard label={b.linkLabel ?? 'Open'} href={b.link} />}
                </span>
              </div>
            ))}
          </div>

          <div className="px-3 py-2 border-t text-[10px] text-ink-3" style={{ borderColor: 'var(--border)' }}>
            Message…
          </div>
        </div>
      </div>
    </div>
  )
}
