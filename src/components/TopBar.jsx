import { codingLanguages, explanationLanguages } from '../data/options'

function SelectControl({ label, value, options, onChange }) {
  return (
    <label className="flex min-w-34 flex-col gap-1 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-800 shadow-sm outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function TopBar({
  codingLanguage,
  explanationLanguage,
  onCodingLanguageChange,
  onExplanationLanguageChange,
  onTranslate,
  onGenerateFlashcards,
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-stone-50/90 px-4 py-4 backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3 text-left">
          <img
            src="/favicon.svg"
            alt="VCodeTutor logo"
            className="h-11 w-11 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Study workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-stone-950">VCodeTutor</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <SelectControl
            label="Code"
            value={codingLanguage}
            options={codingLanguages}
            onChange={onCodingLanguageChange}
          />
          <SelectControl
            label="Explain In"
            value={explanationLanguage}
            options={explanationLanguages}
            onChange={onExplanationLanguageChange}
          />

          <button
            type="button"
            onClick={onTranslate}
            className="h-10 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus:ring-4 focus:ring-stone-300"
          >
            Translate
          </button>
          <button
            type="button"
            onClick={onGenerateFlashcards}
            className="h-10 rounded-xl border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-900 shadow-sm transition hover:bg-teal-100 focus:outline-none focus:ring-4 focus:ring-teal-100"
          >
            Generate Flashcards
          </button>
        </div>
      </div>
    </header>
  )
}
