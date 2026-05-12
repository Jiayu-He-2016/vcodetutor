import { useState } from 'react'

export default function Flashcards({ cards, summary, onGenerateFlashcards, onMarkCard }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (!cards.length) {
    return (
      <section className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-8 text-center shadow-sm">
        <h2 className="text-base font-semibold tracking-normal text-stone-950">Flashcard Review</h2>
        <p className="mt-2 text-sm text-stone-500">Generate flashcards after translating code to start review mode.</p>
        <button
          type="button"
          onClick={onGenerateFlashcards}
          className="mt-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 shadow-sm transition hover:bg-teal-100 focus:outline-none focus:ring-4 focus:ring-teal-100"
        >
          Generate Flashcards
        </button>
      </section>
    )
  }

  const activeCard = cards[Math.min(activeIndex, cards.length - 1)]

  function move(direction) {
    setFlipped(false)
    setActiveIndex((current) => (current + direction + cards.length) % cards.length)
  }

  function mark(status) {
    onMarkCard(activeCard.id, status)
    move(1)
  }

  const knownCount = cards.filter((card) => card.status === 'known').length

  async function downloadCards() {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF()
    let y = 18

    function addWrappedText(text, x, nextY, options = {}) {
      pdf.setFont('helvetica', options.style ?? 'normal')
      pdf.setFontSize(options.size ?? 10)
      const lines = pdf.splitTextToSize(text, options.width ?? 170)
      pdf.text(lines, x, nextY)
      return nextY + lines.length * (options.lineHeight ?? 6)
    }

    function ensureSpace(space = 22) {
      if (y + space < 285) return
      pdf.addPage()
      y = 18
    }

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.text('VCodeTutor Study Notes', 14, y)
    y += 10

    y = addWrappedText(summary.overview, 14, y, { size: 11, width: 180, lineHeight: 7 })
    y += 4

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.text('Summary', 14, y)
    y += 7

    summary.bullets.forEach((bullet) => {
      ensureSpace(14)
      y = addWrappedText(`- ${bullet}`, 18, y, { size: 10, width: 172, lineHeight: 6 })
      y += 2
    })

    y += 5
    ensureSpace(20)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.text('Flashcard Concepts', 14, y)
    y += 8

    cards.forEach((card, index) => {
      ensureSpace(30)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.text(`${index + 1}. ${card.front}`, 14, y)
      y += 6
      y = addWrappedText(`- ${card.back}`, 18, y, { size: 10, width: 172, lineHeight: 6 })
      y += 4
    })

    pdf.save('vcode-tutor-flashcards.pdf')
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-left">
          <h2 className="text-base font-semibold tracking-normal text-stone-950">Flashcard Review</h2>
          <p className="text-sm text-stone-500">
            {knownCount} known of {cards.length} cards
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-500">
          <button
            type="button"
            onClick={downloadCards}
            className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-teal-900 transition hover:bg-teal-100"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => move(-1)}
            className="rounded-xl border border-stone-200 px-3 py-2 transition hover:bg-stone-50"
          >
            Previous
          </button>
          <span>
            {activeIndex + 1} / {cards.length}
          </span>
          <button
            type="button"
            onClick={() => move(1)}
            className="rounded-xl border border-stone-200 px-3 py-2 transition hover:bg-stone-50"
          >
            Next
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((current) => !current)}
        className="group mt-4 block w-full text-left focus:outline-none"
        aria-label="Flip flashcard"
      >
        <div className="flashcard h-56">
          <div className={`flashcard-inner ${flipped ? 'is-flipped' : ''}`}>
            <div className="flashcard-face border-teal-100 bg-teal-50">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">Front</p>
              <p className="mt-5 font-mono text-xl font-semibold text-stone-950">{activeCard.front}</p>
              <p className="mt-4 text-sm text-stone-500">{activeCard.tag}</p>
            </div>
            <div className="flashcard-face flashcard-back border-amber-100 bg-amber-50">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Back</p>
              <p className="mt-5 text-lg leading-8 text-stone-900">{activeCard.back}</p>
            </div>
          </div>
        </div>
      </button>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => mark('known')}
          className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
        >
          I know
        </button>
        <button
          type="button"
          onClick={() => mark('learning')}
          className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
        >
          I don't know
        </button>
      </div>
    </section>
  )
}
