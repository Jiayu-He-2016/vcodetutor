const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'with',
])

export function ingestKnowledgeBase(rawDocuments) {
  return rawDocuments.map((document) => ({
    ...document,
    text: normalizeText(document.text),
  }))
}

export function chunkDocuments(documents, options = {}) {
  const maxWords = options.maxWords ?? 130
  const overlapWords = options.overlapWords ?? 24

  return documents.flatMap((document) => {
    const sections = splitMarkdownSections(document.text)

    return sections.flatMap((section, sectionIndex) => {
      const words = section.text.split(/\s+/).filter(Boolean)
      const chunkCount = Math.max(1, Math.ceil(words.length / maxWords))

      return Array.from({ length: chunkCount }, (_, chunkIndex) => {
        const start = Math.max(0, chunkIndex * maxWords - overlapWords)
        const end = Math.min(words.length, (chunkIndex + 1) * maxWords)
        const chunkText = words.slice(start, end).join(' ')

        return {
          id: `${document.id}:${sectionIndex + 1}:${chunkIndex + 1}`,
          documentId: document.id,
          source: document.source,
          title: section.title || document.title,
          language: document.language,
          text: chunkText,
          tokens: tokenize(`${document.title} ${section.title} ${chunkText}`),
        }
      })
    })
  })
}

export function retrieveRelevantChunks({
  chunks,
  selectedCode,
  fullCodeContext,
  codingLanguage,
  question,
  topK = 4,
}) {
  const queryText = [
    codingLanguage,
    question,
    selectedCode,
    extractNearbyIdentifiers(fullCodeContext),
  ]
    .filter(Boolean)
    .join(' ')
  const queryTokens = tokenize(queryText)

  if (!queryTokens.length) {
    return chunks.slice(0, topK).map((chunk) => ({ ...chunk, score: 0 }))
  }

  const queryCounts = countTokens(queryTokens)

  return chunks
    .map((chunk) => {
      const tokenScore = scoreChunk(chunk.tokens, queryCounts)
      const languageBoost = chunk.language === codingLanguage ? 4 : 0
      const commonBoost = chunk.language === 'common' ? 2 : 0
      const questionBoost = question ? scoreChunk(chunk.tokens, countTokens(tokenize(question))) * 0.5 : 0

      return {
        ...chunk,
        score: tokenScore + languageBoost + commonBoost + questionBoost,
      }
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

export function augmentPromptWithRetrievedContext({
  selectedCode,
  fullCodeContext,
  codingLanguage,
  question,
  retrievedChunks,
}) {
  const context = retrievedChunks
    .map(
      (chunk, index) =>
        `Source ${index + 1}: ${chunk.source} - ${chunk.title}\n${chunk.text}`,
    )
    .join('\n\n')

  return {
    instructions:
      'You are VCodeTutor Ask Assistant, a friendly code tutor. Explain highlighted code to a beginner. Ground the answer in the selected code and retrieved local knowledge base context. If there is no user question, answer: "What does this highlighted code do in this program?" Keep the summary concise. If there is a follow-up question, focus only on that question. If you infer something from surrounding code, label it as an inference. Return concise JSON with summary, stepByStep, keyConcepts, commonMistakes, tryThis, and sources.',
    input: `Selected language: ${codingLanguage}

Optional user question:
${question || 'No extra question provided.'}

Highlighted code:
\`\`\`${codingLanguage}
${selectedCode || '(No highlighted code provided.)'}
\`\`\`

Full code context:
\`\`\`${codingLanguage}
${fullCodeContext || '(No surrounding code provided.)'}
\`\`\`

Retrieved local knowledge base context:
${context || 'No retrieved context was available.'}`,
  }
}

export function generateMockResponse({
  selectedCode,
  codingLanguage,
  question,
  retrievedChunks,
}) {
  const selectedLines = selectedCode
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const firstLine = selectedLines[0] || 'the selected code'
  const concepts = inferConcepts(selectedCode, codingLanguage)
  const intent = followUpIntent(question)

  return {
    mode: 'mock',
    summary: buildSummaryForIntent({
      intent,
      firstLine,
      concepts,
      selectedLines,
      codingLanguage,
    }),
    stepByStep: selectedLines.slice(0, 5).map((line, index) => ({
      label: `Step ${index + 1}`,
      text: explainLine(line, codingLanguage),
    })),
    keyConcepts: concepts.map((concept) => ({
      term: concept,
      definition: conceptDefinition(concept),
    })),
    commonMistakes: [
      'Do not study the highlighted line in isolation if it depends on a value created nearby.',
      'Check whether the selected code creates a value, checks a condition, repeats work, or returns a result.',
    ],
    tryThis:
      'Change one input value, run the code again, and trace which selected line changes behavior first.',
    sources: retrievedChunks.map(formatSource),
  }
}

export function formatSource(chunk) {
  return {
    id: chunk.id,
    source: chunk.source,
    title: chunk.title,
    score: Number(chunk.score.toFixed(2)),
    excerpt: truncate(chunk.text, 260),
  }
}

function splitMarkdownSections(markdown) {
  const lines = markdown.split('\n')
  const sections = []
  let current = { title: '', lines: [] }

  lines.forEach((line) => {
    const heading = line.match(/^#{1,3}\s+(.+)$/)

    if (heading && current.lines.some((item) => item.trim())) {
      sections.push({ title: current.title, text: current.lines.join('\n') })
      current = { title: heading[1], lines: [line] }
      return
    }

    if (heading && !current.title) current.title = heading[1]
    current.lines.push(line)
  })

  if (current.lines.some((item) => item.trim())) {
    sections.push({ title: current.title, text: current.lines.join('\n') })
  }

  return sections
}

function normalizeText(text) {
  return text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim()
}

function tokenize(text = '') {
  return text
    .toLowerCase()
    .replace(/[`"'()[\]{}.,;:<>/+*=!|&-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
}

function countTokens(tokens) {
  return tokens.reduce((counts, token) => {
    counts[token] = (counts[token] ?? 0) + 1
    return counts
  }, {})
}

function scoreChunk(chunkTokens, queryCounts) {
  const chunkCounts = countTokens(chunkTokens)

  return Object.entries(queryCounts).reduce((score, [token, count]) => {
    if (!chunkCounts[token]) return score
    return score + Math.min(count, chunkCounts[token]) * (token.length > 5 ? 2 : 1)
  }, 0)
}

function extractNearbyIdentifiers(code = '') {
  return Array.from(new Set(code.match(/[A-Za-z_]\w*/g) ?? []))
    .slice(0, 40)
    .join(' ')
}

function inferConcepts(code, language) {
  const concepts = []
  if (/\b(function|def)\b|=>/.test(code)) concepts.push('function')
  if (/\bconst\b|\blet\b|=/.test(code)) concepts.push('variable')
  if (/\bif\b/.test(code)) concepts.push('conditional')
  if (/\bfor\b|\bwhile\b/.test(code)) concepts.push('loop')
  if (/\breturn\b/.test(code)) concepts.push('return value')
  if (/\bimport\b|#include/.test(code)) concepts.push('import')
  if (/\bawait\b|\basync\b|fetch\(|requests\./.test(code)) concepts.push('async or API work')
  if (language === 'cpp' && /\bint\b|\bstring\b|\bdouble\b/.test(code)) concepts.push('typed value')

  return concepts.length ? concepts : ['program flow']
}

function explainLine(line, language) {
  if (/\b(function|def)\b|=>/.test(line)) return `This defines reusable behavior in ${language}.`
  if (/\bif\b/.test(line)) return 'This checks a condition before running the next block.'
  if (/\bfor\b|\bwhile\b/.test(line)) return 'This starts repeated work controlled by a loop.'
  if (/\breturn\b/.test(line)) return 'This sends a result back to the caller.'
  if (/\bconst\b|\blet\b|=/.test(line)) return 'This stores or updates a named value.'
  if (/\bimport\b|#include/.test(line)) return 'This brings in code or tools used later.'
  return `This line contributes to the ${language} program flow.`
}

function followUpIntent(question = '') {
  const normalized = question.toLowerCase()
  if (normalized.includes('why use')) return 'why'
  if (normalized.includes('key term')) return 'terms'
  if (normalized.includes('common mistake')) return 'mistake'
  if (normalized.includes('practice')) return 'practice'
  if (normalized.includes('step by step')) return 'steps'
  return 'summary'
}

function buildSummaryForIntent({ intent, firstLine, concepts, selectedLines, codingLanguage }) {
  const codeLabel = truncate(firstLine, 90)

  if (intent === 'why') {
    return `This highlighted code is useful here because it handles ${concepts[0] ?? 'one part of the program flow'} at the exact point where the program needs it. Look at the surrounding lines to see what value it receives and what later code depends on it.`
  }

  if (intent === 'terms') {
    return `Key terms in this selection: ${concepts.join(', ')}. In beginner terms, focus on what value is being named, checked, repeated, or returned.`
  }

  if (intent === 'mistake') {
    return `A common mistake is reading "${codeLabel}" by itself. Check whether it depends on a variable created earlier, a condition that must be true, or a return value used later.`
  }

  if (intent === 'practice') {
    return `Practice question: if the input or variable used by "${codeLabel}" changed, what would this highlighted code do differently? Try predicting the result before running it.`
  }

  if (intent === 'steps') {
    return `Step by step, this ${codingLanguage} selection runs ${selectedLines.length} meaningful line${selectedLines.length === 1 ? '' : 's'}. Read each line as a small action, then connect the actions into one flow.`
  }

  return `This highlighted ${codingLanguage} code handles ${concepts.join(', ')}. In this program, it starts with "${codeLabel}" and helps move the program from the current value or condition toward the next result.`
}

function conceptDefinition(concept) {
  const definitions = {
    function: 'A reusable block of code that can receive inputs and produce a result.',
    variable: 'A name that stores a value so later code can refer to it.',
    conditional: 'A decision point that runs code only when a condition passes.',
    loop: 'A structure that repeats work while moving through values or conditions.',
    'return value': 'The result sent back from a function to the code that called it.',
    import: 'Setup code that makes another module, package, or library available.',
    'async or API work': 'Code that waits for slower work such as network requests.',
    'typed value': 'A value declared with the kind of data it should hold.',
    'program flow': 'The order in which code runs and values move through the program.',
  }

  return definitions[concept] ?? 'A programming idea used by the selected code.'
}

function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text
}
