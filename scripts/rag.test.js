import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  augmentPromptWithRetrievedContext,
  chunkDocuments,
  generateMockResponse,
  ingestKnowledgeBase,
  retrieveRelevantChunks,
} from '../src/services/rag/core.js'

const root = process.cwd()
const documents = [
  {
    id: 'javascript-basics',
    source: 'javascript_basics.md',
    title: 'JavaScript Basics',
    language: 'javascript',
    text: readFileSync(path.join(root, 'knowledge_base/javascript_basics.md'), 'utf8'),
  },
  {
    id: 'common-errors',
    source: 'common_errors.md',
    title: 'Common Programming Errors',
    language: 'common',
    text: readFileSync(path.join(root, 'knowledge_base/common_errors.md'), 'utf8'),
  },
]

const ingested = ingestKnowledgeBase(documents)
const chunks = chunkDocuments(ingested)
const selectedCode = 'const message = "Keep going, " + name'
const retrievedChunks = retrieveRelevantChunks({
  chunks,
  selectedCode,
  fullCodeContext: selectedCode,
  codingLanguage: 'javascript',
  question: 'What does const mean?',
})

assert.ok(ingested.length === 2)
assert.ok(chunks.length >= 2)
assert.ok(retrievedChunks.length > 0)
assert.ok(retrievedChunks.some((chunk) => chunk.source === 'javascript_basics.md'))

const augmentedPrompt = augmentPromptWithRetrievedContext({
  selectedCode,
  fullCodeContext: selectedCode,
  codingLanguage: 'javascript',
  question: 'What does const mean?',
  retrievedChunks,
})

assert.match(augmentedPrompt.input, /Retrieved local knowledge base context/)
assert.match(augmentedPrompt.input, /const message/)

const mockResponse = generateMockResponse({
  selectedCode,
  fullCodeContext: selectedCode,
  codingLanguage: 'javascript',
  question: '',
  retrievedChunks,
})

assert.equal(mockResponse.mode, 'mock')
assert.ok(mockResponse.sources.length > 0)

console.log('RAG pipeline tests passed')
