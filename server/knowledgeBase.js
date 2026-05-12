import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  chunkDocuments,
  ingestKnowledgeBase,
  retrieveRelevantChunks,
} from '../src/services/rag/core.js'

const knowledgeBaseFiles = [
  {
    id: 'python-basics',
    source: 'python_basics.md',
    title: 'Python Basics',
    language: 'python',
  },
  {
    id: 'python-packages',
    source: 'python_packages.md',
    title: 'Python Packages',
    language: 'python',
  },
  {
    id: 'javascript-basics',
    source: 'javascript_basics.md',
    title: 'JavaScript Basics',
    language: 'javascript',
  },
  {
    id: 'cpp-basics',
    source: 'cpp_basics.md',
    title: 'C++ Basics',
    language: 'cpp',
  },
  {
    id: 'common-errors',
    source: 'common_errors.md',
    title: 'Common Programming Errors',
    language: 'common',
  },
  {
    id: 'explanation-style-guide',
    source: 'explanation_style_guide.md',
    title: 'Explanation Style Guide',
    language: 'common',
  },
]

let cachedChunks

export function ingestLocalKnowledgeBase() {
  const root = process.cwd()
  const documents = knowledgeBaseFiles.map((file) => ({
    ...file,
    text: readFileSync(path.join(root, 'knowledge_base', file.source), 'utf8'),
  }))

  return ingestKnowledgeBase(documents)
}

export function chunkLocalDocuments() {
  if (!cachedChunks) {
    cachedChunks = chunkDocuments(ingestLocalKnowledgeBase())
  }

  return cachedChunks
}

export function retrieveFromLocalDocuments(request) {
  return retrieveRelevantChunks({
    ...request,
    chunks: chunkLocalDocuments(),
  })
}
