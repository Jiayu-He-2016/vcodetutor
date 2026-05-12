import { useEffect, useRef } from 'react'

function lineInChunk(line, chunk) {
  return line && line >= chunk.startLine && line <= chunk.endLine
}

export default function ExplanationPanel({
  studyNotes,
  activeLine,
  selectedLine,
  onHoverLine,
}) {
  const chunkRefs = useRef({})

  useEffect(() => {
    if (!selectedLine) return

    const chunk = studyNotes.chunks.find((item) => lineInChunk(selectedLine, item))
    if (!chunk) return

    chunkRefs.current[chunk.id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [selectedLine, studyNotes.chunks])

  return (
    <section className="flex h-[560px] min-h-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm xl:h-[calc(100vh-210px)] xl:min-h-[520px]">
      <div className="border-b border-stone-200 px-4 py-3 text-left">
        <h2 className="text-base font-semibold tracking-normal text-stone-950">Explanation</h2>
        <p className="text-sm text-stone-500">Structured study notes from your code.</p>
      </div>

      <div className="explanation-scroll min-h-0 flex-1 overflow-y-auto p-4">
        <section className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">High-level summary</p>
          <p className="mt-3 text-sm leading-6 text-stone-900">{studyNotes.summary}</p>
        </section>

        <section className="mt-4 space-y-3 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
            Chunk-by-chunk explanation
          </p>
          {studyNotes.chunks.map((chunk) => (
            <article
              key={chunk.id}
              ref={(node) => {
                if (node) chunkRefs.current[chunk.id] = node
              }}
              onMouseEnter={() => onHoverLine(chunk.startLine)}
              onMouseLeave={() => onHoverLine(null)}
              className={`rounded-2xl border p-4 transition ${
                lineInChunk(activeLine, chunk)
                  ? 'border-teal-200 bg-teal-50 shadow-sm'
                  : 'border-stone-100 bg-stone-50/70'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-400">
                    {chunk.lineRange}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-stone-950">{chunk.title}</h3>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-800">{chunk.explanation}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                <span className="font-semibold text-stone-800">Why it matters:</span> {chunk.why}
              </p>
              {chunk.keyItems.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {chunk.keyItems.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>

        <section className="mt-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
            Key concepts glossary
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {studyNotes.glossary.map((item) => (
              <article key={item.term} className="rounded-2xl border border-stone-100 bg-white p-4">
                <h3 className="text-sm font-semibold text-stone-950">{item.term}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{item.definition}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
