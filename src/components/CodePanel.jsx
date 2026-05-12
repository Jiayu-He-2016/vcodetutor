import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { Decoration, EditorView, hoverTooltip } from '@codemirror/view'
import { keywordDefinitions } from '../data/options'

const languageExtensions = {
  javascript: javascript({ jsx: true }),
  python: python(),
  java: java(),
  cpp: cpp(),
}

function keywordTooltip() {
  return hoverTooltip((view, pos) => {
    const line = view.state.doc.lineAt(pos)
    const start = pos
    const end = pos
    const textBefore = line.text.slice(0, start - line.from)
    const textAfter = line.text.slice(end - line.from)
    const beforeMatch = textBefore.match(/[A-Za-z_]+$/)
    const afterMatch = textAfter.match(/^[A-Za-z_]+/)
    const word = `${beforeMatch?.[0] ?? ''}${afterMatch?.[0] ?? ''}`

    if (!keywordDefinitions[word]) return null

    return {
      pos: pos - (beforeMatch?.[0].length ?? 0),
      end: pos + (afterMatch?.[0].length ?? 0),
      above: true,
      create() {
        const dom = document.createElement('div')
        dom.className = 'rounded-lg bg-stone-950 px-3 py-2 text-xs font-medium text-white shadow-xl'
        dom.textContent = keywordDefinitions[word]
        return { dom }
      },
    }
  })
}

function activeLineDecoration(lineNumber) {
  return EditorView.decorations.of((view) => {
    if (!lineNumber || lineNumber > view.state.doc.lines) return Decoration.none

    const line = view.state.doc.line(lineNumber)
    return Decoration.set([Decoration.line({ class: 'vcode-active-code-line' }).range(line.from)])
  })
}

function selectionFromView(view) {
  const range = view.state.selection.main
  if (range.empty) return null

  const fromLine = view.state.doc.lineAt(range.from)
  const toLine = view.state.doc.lineAt(range.to)

  return {
    text: view.state.doc.sliceString(range.from, range.to),
    startLine: fromLine.number,
    endLine: toLine.number,
  }
}

export default function CodePanel({
  code,
  codingLanguage,
  warning,
  activeLine,
  selectionLabel,
  onCodeChange,
  onHoverLine,
  onSelectLine,
  onSelectionChange,
  onTranslate,
  onGenerateFlashcards,
  onAskAssistant,
}) {
  const extensions = useMemo(
    () => [
      languageExtensions[codingLanguage],
      keywordTooltip(),
      activeLineDecoration(activeLine),
      EditorView.lineWrapping,
      EditorView.domEventHandlers({
        mousemove(event, view) {
          if (event.buttons === 1) return

          const position = view.posAtCoords({ x: event.clientX, y: event.clientY })
          if (position == null) return

          onHoverLine(view.state.doc.lineAt(position).number)
        },
        mouseleave() {
          onHoverLine(null)
        },
        mouseup(event, view) {
          if (event.button !== 0) return
          onSelectionChange(selectionFromView(view))
        },
        keyup(event, view) {
          if (!event.shiftKey && !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
            return
          }
          onSelectionChange(selectionFromView(view))
        },
        click(event, view) {
          const selection = selectionFromView(view)
          if (selection?.text?.trim()) {
            onSelectionChange(selection)
            return
          }

          const position = view.posAtCoords({ x: event.clientX, y: event.clientY })
          if (position == null) return

          const lineNumber = view.state.doc.lineAt(position).number
          onSelectLine(lineNumber)
          onHoverLine(lineNumber)
        },
      }),
    ],
    [activeLine, codingLanguage, onHoverLine, onSelectLine, onSelectionChange],
  )

  function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => onCodeChange(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  return (
    <section
      className={`flex h-[560px] min-h-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition xl:h-[calc(100vh-210px)] xl:min-h-[520px] ${
        warning ? 'border-amber-300 ring-4 ring-amber-100' : 'border-stone-200'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
        <div className="text-left">
          <h2 className="text-base font-semibold tracking-normal text-stone-950">Code</h2>
          <p className={`text-sm ${warning ? 'font-semibold text-amber-700' : 'text-stone-500'}`}>
            {warning || 'Type, paste, or upload a source file.'}
          </p>
        </div>

        <label className="cursor-pointer rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-100">
          Upload file
          <input
            type="file"
            accept=".js,.jsx,.py,.java,.cpp,.cc,.cxx,.h,.hpp,.txt"
            onChange={handleUpload}
            className="sr-only"
          />
        </label>
      </div>

      <CodeMirror
        value={code}
        height="100%"
        minHeight="380px"
        basicSetup={{
          autocompletion: true,
          bracketMatching: true,
          foldGutter: true,
          highlightActiveLine: false,
          lineNumbers: true,
        }}
        extensions={extensions}
        onChange={onCodeChange}
        className="min-h-0 flex-1 overflow-auto text-left text-sm"
        theme="light"
      />

      <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 bg-stone-50 px-4 py-3">
        <div className="mr-auto self-center text-xs font-medium text-stone-500">
          {selectionLabel || 'Select code for Ask Assistant'}
        </div>
        <button
          type="button"
          onClick={onAskAssistant}
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-100"
        >
          Ask Assistant
        </button>
        <button
          type="button"
          onClick={onTranslate}
          className="rounded-xl bg-stone-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus:ring-4 focus:ring-stone-300"
        >
          Translate
        </button>
        <button
          type="button"
          onClick={onGenerateFlashcards}
          className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 shadow-sm transition hover:bg-teal-100 focus:outline-none focus:ring-4 focus:ring-teal-100"
        >
          Generate Flashcards
        </button>
      </div>
    </section>
  )
}
