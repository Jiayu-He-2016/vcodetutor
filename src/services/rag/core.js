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
  outputLanguage = 'english',
  question,
  retrievedChunks,
}) {
  const context = retrievedChunks
    .map(
      (chunk, index) =>
        `Source ${index + 1}: ${chunk.source} - ${chunk.title}\n${chunk.text}`,
    )
    .join('\n\n')

  const responseLanguage = outputLanguage === 'chinese'
    ? 'Chinese. Use natural beginner-friendly Chinese. Keep programming keywords, package names, function names, and code syntax in their original form when helpful.'
    : 'English. Use beginner-friendly English.'

  return {
    instructions:
      `You are VCodeTutor Ask Assistant, a friendly code tutor. Explain highlighted code to a beginner. Respond in ${responseLanguage} Ground the answer in the selected code and retrieved local knowledge base context. If there is no user question, answer: "What does this highlighted code do in this program?" Keep the summary concise. If there is a follow-up question, focus only on that question. If you infer something from surrounding code, label it as an inference. Return concise JSON with summary, stepByStep, keyConcepts, commonMistakes, tryThis, and sources.`,
    input: `Selected language: ${codingLanguage}
Response language: ${outputLanguage}

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
  outputLanguage = 'english',
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
      outputLanguage,
    }),
    stepByStep: selectedLines.slice(0, 5).map((line, index) => ({
      label: outputLanguage === 'chinese' ? `步骤 ${index + 1}` : `Step ${index + 1}`,
      text: explainLine(line, codingLanguage, outputLanguage),
    })),
    keyConcepts: concepts.map((concept) => ({
      term: concept,
      definition: conceptDefinition(concept, outputLanguage),
    })),
    commonMistakes: outputLanguage === 'chinese'
      ? [
          '不要只孤立地看高亮行；如果它依赖前面创建的值，也要一起看。',
          '先判断这段代码是在创建值、检查条件、重复工作，还是返回结果。',
        ]
      : [
          'Do not study the highlighted line in isolation if it depends on a value created nearby.',
          'Check whether the selected code creates a value, checks a condition, repeats work, or returns a result.',
        ],
    tryThis: outputLanguage === 'chinese'
      ? '试着改一个输入值，再跟踪哪一行最先改变行为。'
      : 'Change one input value, run the code again, and trace which selected line changes behavior first.',
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

function explainLine(line, language, outputLanguage = 'english') {
  if (outputLanguage === 'chinese') {
    if (/\b(function|def)\b|=>/.test(line)) return `这一行在 ${languageDisplay(language)} 里定义可复用的行为。`
    if (/\bif\b/.test(line)) return '这一行检查条件，决定后面的代码块是否运行。'
    if (/\bfor\b|\bwhile\b/.test(line)) return '这一行开始重复执行的 loop。'
    if (/\breturn\b/.test(line)) return '这一行把结果返回给调用者。'
    if (/\bconst\b|\blet\b|=/.test(line)) return '这一行保存或更新一个有名字的值。'
    if (/\bimport\b|#include/.test(line)) return '这一行引入后面会用到的工具或代码。'
    return `这一行是 ${languageDisplay(language)} 程序流程的一部分。`
  }

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
  if (normalized.includes('why use') || question.includes('为什么')) return 'why'
  if (normalized.includes('key term') || question.includes('关键术语')) return 'terms'
  if (normalized.includes('common mistake') || question.includes('常见错误')) return 'mistake'
  if (normalized.includes('practice') || question.includes('练习')) return 'practice'
  if (normalized.includes('step by step') || question.includes('一步一步')) return 'steps'
  return 'summary'
}

function buildSummaryForIntent({ intent, firstLine, concepts, selectedLines, codingLanguage, outputLanguage }) {
  const codeLabel = truncate(firstLine, 90)
  const language = languageDisplay(codingLanguage)

  if (outputLanguage === 'chinese') {
    const conceptText = concepts.map(conceptPhraseZh).join('、')
    const firstConcept = conceptPhraseZh(concepts[0] ?? 'program flow')
    if (intent === 'why') {
      return `这段高亮代码放在这里，是因为程序正好需要处理 ${firstConcept}。可以看看它接收了什么值，以及后面的代码是否依赖它。`
    }

    if (intent === 'terms') {
      return `这段代码里的关键概念有：${conceptText}。初学时，重点看它是在命名值、检查条件、重复工作，还是返回结果。`
    }

    if (intent === 'mistake') {
      return `常见错误是只看 “${codeLabel}” 这一行本身。请同时检查它是否依赖前面创建的变量、必须成立的条件，或后面会使用的 return 值。`
    }

    if (intent === 'practice') {
      return `练习题：如果 “${codeLabel}” 用到的输入或变量改变了，这段高亮代码的行为会怎样变化？先预测，再运行验证。`
    }

    if (intent === 'steps') {
      return `一步一步看，这段 ${language} 高亮代码有 ${selectedLines.length} 行有意义的内容。把每一行当成一个小动作，再把这些动作连成完整流程。`
    }

    return `这段高亮的 ${language} 代码主要处理 ${conceptText}。在这个程序里，它从 “${codeLabel}” 开始，帮助程序把当前值或条件推进到下一步结果。`
  }

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
    return `Step by step, this ${language} selection runs ${selectedLines.length} meaningful line${selectedLines.length === 1 ? '' : 's'}. Read each line as a small action, then connect the actions into one flow.`
  }

  return `This highlighted ${language} code handles ${concepts.join(', ')}. In this program, it starts with "${codeLabel}" and helps move the program from the current value or condition toward the next result.`
}

function conceptDefinition(concept, outputLanguage = 'english') {
  if (outputLanguage === 'chinese') {
    const definitions = {
      function: '一段可复用的代码，可以接收输入并产生结果。',
      variable: '给一个值起名字，方便后面的代码继续使用。',
      conditional: '一个判断点，条件成立时才运行对应代码。',
      loop: '一种重复执行工作的结构。',
      'return value': 'function 交回给调用者的结果。',
      import: '准备代码，让当前文件可以使用其他模块、包或库。',
      'async or API work': '处理网络请求等稍后才完成的任务。',
      'typed value': '声明时带有数据类型的值。',
      'program flow': '代码运行的顺序，以及值如何在程序里移动。',
    }

    return definitions[concept] ?? '这段代码里用到的一个编程概念。'
  }

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

function conceptPhraseZh(concept) {
  const phrases = {
    function: 'function',
    variable: '变量',
    conditional: '条件判断',
    loop: 'loop',
    'return value': 'return 值',
    import: 'import',
    'async or API work': '异步或 API 任务',
    'typed value': '带类型的值',
    'program flow': '程序流程',
  }

  return phrases[concept] ?? concept
}

function languageDisplay(language) {
  const names = {
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
  }

  return names[language] ?? language
}

function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text
}
