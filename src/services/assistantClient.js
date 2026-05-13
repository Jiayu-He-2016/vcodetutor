import {
  augmentPromptWithRetrievedContext,
  generateMockResponse,
} from './rag/core'
import { retrieveFromLocalKnowledgeBase } from './rag/knowledgeBase'

const ASSISTANT_MODE = import.meta.env.VITE_ASSISTANT_MODE ?? 'mock'

export async function askAssistant({
  selectedCode,
  fullCodeContext,
  codingLanguage,
  explanationLanguage,
  question,
}) {
  const retrievedChunks = retrieveFromLocalKnowledgeBase({
    selectedCode,
    fullCodeContext,
    codingLanguage,
    question,
  })
  if (ASSISTANT_MODE !== 'local') {
    const augmentedPrompt = augmentPromptWithRetrievedContext({
      selectedCode,
      fullCodeContext,
      codingLanguage,
      outputLanguage: explanationLanguage,
      question,
      retrievedChunks,
    })

    return {
      ...generateMockResponse({
        selectedCode,
        fullCodeContext,
        codingLanguage,
        outputLanguage: explanationLanguage,
        question,
        retrievedChunks,
      }),
      pipeline: pipelineSummary('mock'),
      augmentedPromptPreview: augmentedPrompt.input.slice(0, 280),
    }
  }

  const response = await fetch('/api/ask-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedCode,
      fullCodeContext,
      codingLanguage,
      explanationLanguage,
      question,
    }),
  })

  if (!response.ok) {
    const details = await response.json().catch(() => ({}))
    throw new Error(details.error || 'The local assistant API could not answer.')
  }

  const result = await response.json()

  return {
    ...result,
    pipeline: pipelineSummary('local'),
  }
}

export function getAssistantMode() {
  return ASSISTANT_MODE === 'local' ? 'local' : 'mock'
}

function pipelineSummary(mode) {
  return [
    'ingest knowledge base',
    'chunk documents',
    'retrieve relevant chunks',
    'augment prompt with retrieved context',
    mode === 'local' ? 'generate response with local backend' : 'generate response in mock mode',
  ]
}
