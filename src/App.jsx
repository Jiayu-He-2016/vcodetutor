import { useMemo, useRef, useState } from 'react'
import AssistantPanel from './components/AssistantPanel'
import CodePanel from './components/CodePanel'
import ExplanationPanel from './components/ExplanationPanel'
import Flashcards from './components/Flashcards'
import TopBar from './components/TopBar'
import { sampleCode } from './data/options'
import { askAssistant, getAssistantMode } from './services/assistantClient'
import {
  createFlashcards,
  createStudyNotes,
  detectCodingLanguage,
  summarizeCode,
  translateCode,
} from './services/mockTranslator'

function App() {
  const [code, setCode] = useState(sampleCode)
  const [codingLanguage, setCodingLanguage] = useState('javascript')
  const [explanationLanguage, setExplanationLanguage] = useState('english')
  const [explanationLevel, setExplanationLevel] = useState('beginner')
  const [hoveredLine, setHoveredLine] = useState(null)
  const [selectedLine, setSelectedLine] = useState(null)
  const [codeWarning, setCodeWarning] = useState('')
  const [assistantSelection, setAssistantSelection] = useState(null)
  const [assistantSelectedCode, setAssistantSelectedCode] = useState('')
  const [assistantSelectionLabel, setAssistantSelectionLabel] = useState('')
  const [assistantMessages, setAssistantMessages] = useState([])
  const [assistantStatus, setAssistantStatus] = useState('idle')
  const [assistantError, setAssistantError] = useState('')
  const [lastIntroducedCodeKey, setLastIntroducedCodeKey] = useState('')
  const flashcardsRef = useRef(null)
  const assistantRef = useRef(null)

  const initialExplanations = useMemo(
    () =>
      translateCode({
        code: sampleCode,
        codingLanguage: 'javascript',
        explanationLanguage: 'english',
        explanationLevel: 'beginner',
      }),
    [],
  )

  const [explanations, setExplanations] = useState(initialExplanations)
  const [studyNotes, setStudyNotes] = useState(() =>
    createStudyNotes({
      code: sampleCode,
      codingLanguage: 'javascript',
      explanations: initialExplanations,
      explanationLevel: 'beginner',
    }),
  )
  const [flashcards, setFlashcards] = useState([])
  const [flashcardVersion, setFlashcardVersion] = useState(0)

  const summary = useMemo(
    () =>
      summarizeCode({
        code,
        codingLanguage,
        explanations,
      }),
    [code, codingLanguage, explanations],
  )

  function translateWithSettings({
    nextCode = code,
    nextCodingLanguage = codingLanguage,
    nextExplanationLanguage = explanationLanguage,
    nextExplanationLevel = explanationLevel,
  } = {}) {
    const nextExplanations = translateCode({
      code: nextCode,
      codingLanguage: nextCodingLanguage,
      explanationLanguage: nextExplanationLanguage,
      explanationLevel: nextExplanationLevel,
    })

    setExplanations(nextExplanations)
    setStudyNotes(
      createStudyNotes({
        code: nextCode,
        codingLanguage: nextCodingLanguage,
        explanations: nextExplanations,
        explanationLevel: nextExplanationLevel,
      }),
    )
    setHoveredLine(null)
    setSelectedLine(null)
    setAssistantSelection(null)
    setAssistantSelectedCode('')
    setAssistantSelectionLabel('')
    setLastIntroducedCodeKey('')

    return nextExplanations
  }

  function handleCodeChange(nextCode) {
    const detectedLanguage = detectCodingLanguage(nextCode)
    const nextCodingLanguage = detectedLanguage ?? codingLanguage

    setCode(nextCode)
    if (detectedLanguage && detectedLanguage !== codingLanguage) {
      setCodingLanguage(detectedLanguage)
    }
    translateWithSettings({ nextCode, nextCodingLanguage })

    if (nextCode.trim()) {
      setCodeWarning('')
    }
  }

  function handleTranslate() {
    translateWithSettings()
  }

  function handleGenerateFlashcards() {
    if (!code.trim()) {
      setCodeWarning('Please have some code in first.')
      setFlashcards([])
      return
    }

    const nextExplanations = translateWithSettings()

    setFlashcards(createFlashcards(nextExplanations))
    setFlashcardVersion((version) => version + 1)
    setCodeWarning('')

    window.requestAnimationFrame(() => {
      flashcardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function handleSettingsChange(setting, value) {
    const nextSettings = {
      codingLanguage,
      explanationLanguage,
      explanationLevel,
      [setting]: value,
    }

    if (setting === 'codingLanguage') setCodingLanguage(value)
    if (setting === 'explanationLanguage') setExplanationLanguage(value)
    if (setting === 'explanationLevel') setExplanationLevel(value)

    translateWithSettings({
      nextCodingLanguage: nextSettings.codingLanguage,
      nextExplanationLanguage: nextSettings.explanationLanguage,
      nextExplanationLevel: nextSettings.explanationLevel,
    })
  }

  function handleMarkCard(cardId, status) {
    setFlashcards((cards) =>
      cards.map((card) => (card.id === cardId ? { ...card, status } : card)),
    )
  }

  function selectionLabelForRange(selection) {
    if (!selection?.text?.trim()) return ''
    const { startLine, endLine } = selection

    return startLine === endLine
      ? `Selected line ${startLine}`
      : `Selected lines ${startLine}-${endLine}`
  }

  function updateAssistantSelection(selection) {
    if (!selection?.text?.trim()) return

    setAssistantSelection(selection)
    setAssistantSelectedCode(selection.text)
    setAssistantSelectionLabel(selectionLabelForRange(selection))
  }

  function handleSelectLine(lineNumber) {
    setSelectedLine(lineNumber)

    const lineText = code.split('\n')[lineNumber - 1] ?? ''
    setAssistantSelectedCode(lineText)
    setAssistantSelectionLabel(`Selected line ${lineNumber}`)
  }

  function getFallbackSelectedCode() {
    if (assistantSelectedCode.trim()) return assistantSelectedCode
    if (assistantSelection?.text?.trim()) return assistantSelection.text
    if (!selectedLine) return ''

    return code.split('\n')[selectedLine - 1] ?? ''
  }

  function getAssistantSelectionLabel() {
    if (assistantSelectionLabel) return assistantSelectionLabel
    if (selectedLine) return `Selected line ${selectedLine}`
    return ''
  }

  function scrollToAssistant() {
    window.requestAnimationFrame(() => {
      assistantRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function appendUserMessage(prompt) {
    setAssistantMessages((messages) => [
      ...messages,
      {
        id: `${Date.now()}-${messages.length}-user`,
        role: 'user',
        text: prompt,
      },
    ])
  }

  function appendCodeDivider(selectedCode, selectionLabel) {
    setAssistantMessages((messages) => [
      ...messages,
      {
        id: `${Date.now()}-${messages.length}-code`,
        role: 'code',
        label: selectionLabel || 'Highlighted code',
        code: selectedCode,
      },
    ])
  }

  function codeContextKey(selectedCode, selectionLabel) {
    return `${selectionLabel || 'Highlighted code'}\n${selectedCode}`
  }

  function appendAssistantReply(result, prompt) {
    setAssistantMessages((messages) => [
      ...messages,
      {
        id: `${Date.now()}-${messages.length}-assistant`,
        role: 'assistant',
        prompt,
        text: result.summary,
        result,
      },
    ])
  }

  async function handleAskAssistant(prompt = 'What does this highlighted code do in this program?') {
    const selectedCode = getFallbackSelectedCode()
    scrollToAssistant()

    if (!selectedCode.trim()) {
      setAssistantError('Highlight code or click a line before asking the assistant.')
      return
    }

    setAssistantStatus('loading')
    setAssistantError('')
    const selectionLabel = getAssistantSelectionLabel()
    const nextCodeKey = codeContextKey(selectedCode, selectionLabel)
    if (nextCodeKey !== lastIntroducedCodeKey) {
      appendCodeDivider(selectedCode, selectionLabel)
      setLastIntroducedCodeKey(nextCodeKey)
    }
    appendUserMessage(prompt)

    try {
      const result = await askAssistant({
        selectedCode,
        fullCodeContext: code,
        codingLanguage,
        question: prompt,
      })

      appendAssistantReply(result, prompt)
      setAssistantStatus('success')
    } catch (error) {
      setAssistantError(error instanceof Error ? error.message : 'The assistant could not answer.')
      setAssistantStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <TopBar
        codingLanguage={codingLanguage}
        explanationLanguage={explanationLanguage}
        explanationLevel={explanationLevel}
        onCodingLanguageChange={(value) => handleSettingsChange('codingLanguage', value)}
        onExplanationLanguageChange={(value) => handleSettingsChange('explanationLanguage', value)}
        onExplanationLevelChange={(value) => handleSettingsChange('explanationLevel', value)}
        onTranslate={handleTranslate}
        onGenerateFlashcards={handleGenerateFlashcards}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <CodePanel
            code={code}
            codingLanguage={codingLanguage}
            warning={codeWarning}
            activeLine={hoveredLine ?? selectedLine}
            selectionLabel={getAssistantSelectionLabel()}
            onCodeChange={handleCodeChange}
            onHoverLine={setHoveredLine}
            onSelectLine={handleSelectLine}
            onSelectionChange={updateAssistantSelection}
            onTranslate={handleTranslate}
            onGenerateFlashcards={handleGenerateFlashcards}
            onAskAssistant={() => handleAskAssistant()}
          />
          <ExplanationPanel
            studyNotes={studyNotes}
            activeLine={hoveredLine ?? selectedLine}
            selectedLine={selectedLine}
            onHoverLine={setHoveredLine}
          />
        </div>

        <div ref={assistantRef}>
          <AssistantPanel
            mode={getAssistantMode()}
            status={assistantStatus}
            error={assistantError}
            messages={assistantMessages}
            onFollowUp={handleAskAssistant}
          />
        </div>

        <div ref={flashcardsRef}>
          <Flashcards
            key={flashcardVersion}
            cards={flashcards}
            summary={summary}
            onGenerateFlashcards={handleGenerateFlashcards}
            onMarkCard={handleMarkCard}
          />
        </div>
      </main>
    </div>
  )
}

export default App
