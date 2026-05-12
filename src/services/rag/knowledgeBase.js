import {
  chunkDocuments,
  ingestKnowledgeBase,
  retrieveRelevantChunks,
} from './core'
import commonErrors from '../../../knowledge_base/common_errors.md?raw'
import cppBasics from '../../../knowledge_base/cpp_basics.md?raw'
import explanationStyleGuide from '../../../knowledge_base/explanation_style_guide.md?raw'
import javascriptBasics from '../../../knowledge_base/javascript_basics.md?raw'
import pythonBasics from '../../../knowledge_base/python_basics.md?raw'
import pythonPackages from '../../../knowledge_base/python_packages.md?raw'

const rawKnowledgeBaseDocuments = [
  {
    id: 'python-basics',
    source: 'python_basics.md',
    title: 'Python Basics',
    language: 'python',
    text: pythonBasics,
  },
  {
    id: 'python-packages',
    source: 'python_packages.md',
    title: 'Python Packages',
    language: 'python',
    text: pythonPackages,
  },
  {
    id: 'javascript-basics',
    source: 'javascript_basics.md',
    title: 'JavaScript Basics',
    language: 'javascript',
    text: javascriptBasics,
  },
  {
    id: 'cpp-basics',
    source: 'cpp_basics.md',
    title: 'C++ Basics',
    language: 'cpp',
    text: cppBasics,
  },
  {
    id: 'common-errors',
    source: 'common_errors.md',
    title: 'Common Programming Errors',
    language: 'common',
    text: commonErrors,
  },
  {
    id: 'explanation-style-guide',
    source: 'explanation_style_guide.md',
    title: 'Explanation Style Guide',
    language: 'common',
    text: explanationStyleGuide,
  },
]

const ingestedKnowledgeBase = ingestKnowledgeBase(rawKnowledgeBaseDocuments)
const knowledgeBaseChunks = chunkDocuments(ingestedKnowledgeBase)

export function retrieveFromLocalKnowledgeBase(request) {
  return retrieveRelevantChunks({
    ...request,
    chunks: knowledgeBaseChunks,
  })
}

export function getKnowledgeBaseStats() {
  return {
    documentCount: ingestedKnowledgeBase.length,
    chunkCount: knowledgeBaseChunks.length,
  }
}
