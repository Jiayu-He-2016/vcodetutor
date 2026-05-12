import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import OpenAI from 'openai'
import {
  augmentPromptWithRetrievedContext,
  formatSource,
} from '../src/services/rag/core.js'
import { retrieveFromLocalDocuments } from './knowledgeBase.js'

dotenv.config({ path: '.env.local', quiet: true })
dotenv.config({ quiet: true })

const app = express()
const port = Number(process.env.ASSISTANT_PORT ?? 5175)
const host = process.env.ASSISTANT_HOST ?? '127.0.0.1'

app.use(cors({ origin: process.env.ASSISTANT_CORS_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (request, response) => {
  response.json({ ok: true, mode: 'local' })
})

app.post('/api/ask-assistant', async (request, response) => {
  try {
    const {
      selectedCode = '',
      fullCodeContext = '',
      codingLanguage = 'javascript',
      question = '',
    } = request.body ?? {}

    if (!selectedCode.trim() && !fullCodeContext.trim()) {
      response.status(400).json({ error: 'Select or provide code before asking the assistant.' })
      return
    }

    if (!process.env.OPENAI_API_KEY) {
      response.status(500).json({
        error:
          'OPENAI_API_KEY is missing. Add it to .env.local, or set VITE_ASSISTANT_MODE=mock for portfolio-safe demo mode.',
      })
      return
    }

    const retrievedChunks = retrieveFromLocalDocuments({
      selectedCode,
      fullCodeContext,
      codingLanguage,
      question,
    })
    const augmentedPrompt = augmentPromptWithRetrievedContext({
      selectedCode,
      fullCodeContext,
      codingLanguage,
      question,
      retrievedChunks,
    })

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      instructions: augmentedPrompt.instructions,
      input: augmentedPrompt.input,
      temperature: 0.3,
    })

    const parsed = parseAssistantJson(completion.output_text)

    response.json({
      mode: 'local',
      ...parsed,
      sources: retrievedChunks.map(formatSource),
    })
  } catch (error) {
    console.error(error)
    response.status(500).json({
      error: error instanceof Error ? error.message : 'The local assistant failed.',
    })
  }
})

app.listen(port, host, () => {
  console.log(`VCodeTutor local assistant API running at http://${host}:${port}`)
})

function parseAssistantJson(text = '') {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  try {
    return normalizeAssistantResponse(JSON.parse(cleaned))
  } catch {
    return normalizeAssistantResponse({
      summary: cleaned || 'The local assistant returned an empty response.',
      stepByStep: [],
      keyConcepts: [],
      commonMistakes: [],
      tryThis: '',
    })
  }
}

function normalizeAssistantResponse(value) {
  return {
    summary: String(value.summary ?? ''),
    stepByStep: normalizeList(value.stepByStep),
    keyConcepts: normalizeList(value.keyConcepts),
    commonMistakes: normalizeList(value.commonMistakes),
    tryThis: String(value.tryThis ?? ''),
  }
}

function normalizeList(value) {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    if (typeof item === 'string') return item
    if (item && typeof item === 'object') return item
    return String(item)
  })
}
