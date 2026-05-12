const functionLikeBlockers = new Set(['if', 'for', 'while', 'switch', 'catch'])
const structuralLines = new Set(['{', '}', '};', '};)', '}', 'else {', 'else'])
const packageGlossary = {
  requests: 'A Python library used to send HTTP requests and get data from websites or APIs.',
  json: 'A Python module for reading and writing JSON data.',
  os: 'A Python module for interacting with files, folders, paths, and environment variables.',
  numpy: 'A Python library for numerical computing and array operations.',
  pandas: 'A Python library for working with table-like data.',
  matplotlib: 'A Python library for creating charts and visualizations.',
  react: 'A JavaScript library for building user interfaces from components.',
  useState: 'A React hook that stores a changing value and gives you a setter to update it.',
  iostream: 'A C++ standard library header for console input and output.',
}

const conceptGlossary = {
  import: 'Brings code from another module, package, or library into this file.',
  function: 'A named block of reusable logic that can receive inputs and optionally return a result.',
  class: 'A blueprint for grouping related data and behavior.',
  state: 'A UI value that can change over time and cause a component to update.',
  const: 'A named value whose binding should not be reassigned.',
  let: 'A named value that may change later.',
  if: 'A decision point that runs code only when a condition is true.',
  for: 'A loop that repeats a block of code.',
  return: 'Sends a result back from a function.',
  print: 'Displays or logs a value so it can be seen.',
  call: 'Runs an existing function with optional input values.',
  async: 'Marks code that works with asynchronous operations.',
  await: 'Pauses async code until a promise or async operation finishes.',
  with: 'A Python keyword that safely opens and closes resources such as files.',
  self: 'A Python name for the current object inside a class method.',
  args: 'Short for arguments; values passed into a function or command.',
  api: 'Code that sends or prepares a request to an external service.',
  data: 'Code that loads, parses, cleans, or reshapes data.',
  resource: 'Code that safely manages a file, network connection, or other resource.',
  error: 'Code that handles failures so the program can respond safely.',
}

function analyzeLine(line, language) {
  const trimmed = line.trim()
  const cleaned = trimmed.replace(/;$/, '')

  if (!trimmed) return { concept: 'blank' }
  if (structuralLines.has(trimmed)) return { concept: 'structure' }
  if (trimmed.startsWith('//') || trimmed.startsWith('# ') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
    return { concept: 'comment', note: trimmed.replace(/^\/\/|^#|^\/\*|\*\/$/g, '').trim() }
  }
  if (/^#include\b|\b(import|from|using)\b/.test(trimmed)) return analyzeImport(trimmed, language)
  if (/\bclass\b/.test(trimmed)) return { concept: 'class', name: trimmed.match(/\bclass\s+([A-Za-z_]\w*)/)?.[1] }
  if (/\b(try|catch|except|finally)\b/.test(trimmed)) return { concept: 'error', expression: cleaned }
  if (/\bwith\b/.test(trimmed)) return { concept: 'resource', expression: cleaned, name: trimmed.match(/with\s+(.+?)(?:\s+as\s+([A-Za-z_]\w*))?:/)?.[2] }
  if (/\b(fetch|axios\.|requests\.(get|post|put|delete)|http\.|client\.)/.test(trimmed)) return { concept: 'api', expression: cleaned, name: trimmed.match(/([A-Za-z_]\w*)\s*=/)?.[1] }
  if (/\b(json\.(load|loads|dump|dumps)|open\(|read_csv|to_csv|np\.|numpy\.|pandas\.|pd\.)/.test(trimmed)) {
    return { concept: 'data', expression: cleaned, name: trimmed.match(/([A-Za-z_]\w*)\s*=/)?.[1] }
  }
  if (/\bawait\b|\basync\b/.test(trimmed) && !isFunctionDefinition(trimmed, language)) return { concept: 'async', expression: cleaned }
  if (/\b(console\.log|print|System\.out\.println|cout)\b/.test(trimmed)) return analyzePrint(trimmed)
  if (/\bif\b/.test(trimmed)) return { concept: 'if', condition: trimmed.match(/\((.*)\)|if\s+(.+):?$/)?.[1] ?? trimmed.match(/if\s+(.+):?$/)?.[1] }
  if (/\bfor\b/.test(trimmed)) return analyzeLoop(trimmed, language)
  if (/\breturn\b/.test(trimmed)) return { concept: 'return', value: cleaned.replace(/^return\s+/, '').trim() }
  if (isFunctionDefinition(trimmed, language)) return analyzeFunction(trimmed, language)

  const variable = analyzeVariable(cleaned, language)
  if (variable) return variable

  const call = analyzeCall(cleaned)
  if (call) return call

  return { concept: 'expression', expression: cleaned }
}

function isFunctionDefinition(trimmed, language) {
  if (/\b(function|def)\b/.test(trimmed)) return true
  if (language === 'javascript' && /(?:const|let|var)?\s*[A-Za-z_]\w*\s*=\s*(?:\([^)]*\)|[A-Za-z_]\w*)\s*=>/.test(trimmed)) {
    return true
  }

  const callLikeMatch = trimmed.match(/^([A-Za-z_][\w\s:<>,*&[\]]+)?\s*([A-Za-z_]\w*)\s*\([^)]*\)\s*(\{|:)?$/)
  const possibleName = callLikeMatch?.[2]

  if (!possibleName || functionLikeBlockers.has(possibleName)) return false
  if (language === 'javascript' && !trimmed.includes('=>') && !trimmed.endsWith('{')) return false

  return Boolean(callLikeMatch)
}

function isAssignment(trimmed, language) {
  if (/[=!<>]=|=>/.test(trimmed)) return false
  if (!/^[A-Za-z_]\w*(\.[A-Za-z_]\w*)?\s*=/.test(trimmed)) return false

  return ['python', 'javascript'].includes(language)
}

function analyzeImport(trimmed, language) {
  if (trimmed.startsWith('#include')) {
    return { concept: 'import', module: trimmed.match(/<([^>]+)>|"([^"]+)"/)?.[1] ?? trimmed, imported: [] }
  }

  if (trimmed.startsWith('from ')) {
    const match = trimmed.match(/^from\s+([\w.]+)\s+import\s+(.+)/)
    return {
      concept: 'import',
      module: match?.[1],
      imported: splitNames(match?.[2]),
    }
  }

  if (trimmed.startsWith('import ') && language === 'javascript') {
    const module = trimmed.match(/from\s+['"]([^'"]+)['"]/)?.[1] ?? trimmed.match(/['"]([^'"]+)['"]/)?.[1]
    const beforeFrom = trimmed.replace(/^import\s+/, '').split(/\s+from\s+/)[0]

    return {
      concept: 'import',
      module,
      imported: splitNames(beforeFrom.replace(/[{}]/g, '')),
    }
  }

  if (trimmed.startsWith('import ')) {
    const modules = splitNames(trimmed.replace(/^import\s+/, '').replace(/;$/, '')).map((name) =>
      name.replace(/\s+as\s+\w+/, '').trim(),
    )
    return { concept: 'import', module: modules[0], imported: modules }
  }

  return { concept: 'import', module: trimmed.replace(/;$/, ''), imported: [] }
}

function analyzePrint(trimmed) {
  const value =
    trimmed.match(/console\.log\((.*)\)/)?.[1] ??
    trimmed.match(/print\((.*)\)/)?.[1] ??
    trimmed.match(/System\.out\.println\((.*)\)/)?.[1] ??
    trimmed.match(/cout\s*<<\s*(.*)/)?.[1]?.replace(/<<\s*endl$/, '').trim()

  return { concept: 'print', value }
}

function analyzeLoop(trimmed, language) {
  if (language === 'python') {
    const match = trimmed.match(/for\s+([A-Za-z_]\w*)\s+in\s+(.+):?/)
    return { concept: 'for', variable: match?.[1], source: match?.[2]?.replace(/:$/, '') }
  }

  const forBody = trimmed.match(/for\s*\((.*)\)/)?.[1]
  const parts = forBody?.split(';').map((part) => part.trim()) ?? []
  const variable = parts[0]?.match(/([A-Za-z_]\w*)\s*=/)?.[1]
  return { concept: 'for', variable, source: parts.filter(Boolean).join('; ') }
}

function analyzeFunction(trimmed, language) {
  if (language === 'python') {
    const match = trimmed.match(/def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/)
    return { concept: 'function', name: match?.[1], params: splitNames(match?.[2]) }
  }

  const jsFunction = trimmed.match(/function\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/)
  if (jsFunction) return { concept: 'function', name: jsFunction[1], params: splitNames(jsFunction[2]) }

  const arrow = trimmed.match(/(?:const|let|var)?\s*([A-Za-z_]\w*)\s*=\s*(?:\(([^)]*)\)|([A-Za-z_]\w*))\s*=>/)
  if (arrow) {
    return { concept: 'function', name: arrow[1], params: splitNames(arrow[2] ?? arrow[3]), isArrow: true }
  }

  const method = trimmed.match(/(?:public|private|protected|static|final|async|\s)*[\w:<>,*&[\]]+\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/)
  return { concept: 'function', name: method?.[1], params: splitNames(method?.[2]) }
}

function analyzeVariable(cleaned, language) {
  const stateMatch = cleaned.match(/(?:const|let|var)\s+\[\s*([A-Za-z_]\w*)\s*,\s*([A-Za-z_]\w*)\s*]\s*=\s*useState\((.*)\)/)
  if (stateMatch) {
    return {
      concept: 'state',
      variable: stateMatch[1],
      setter: stateMatch[2],
      value: stateMatch[3],
      kind: 'useState',
    }
  }

  const jsMatch = cleaned.match(/^(const|let|var)\s+([A-Za-z_$]\w*)\s*=\s*(.+)$/)
  if (jsMatch) {
    return { concept: jsMatch[1] === 'const' ? 'const' : 'let', kind: jsMatch[1], variable: jsMatch[2], value: jsMatch[3] }
  }

  const typedMatch = cleaned.match(/^(?:final\s+)?([A-Za-z_][\w:<>,\s*&[\]]+)\s+([A-Za-z_]\w*)\s*=\s*(.+)$/)
  if (typedMatch && ['java', 'cpp'].includes(language)) {
    return { concept: cleaned.startsWith('final ') ? 'const' : 'let', type: typedMatch[1].trim(), variable: typedMatch[2], value: typedMatch[3] }
  }

  const assignmentMatch = cleaned.match(/^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?)\s*=\s*(.+)$/)
  if (assignmentMatch && isAssignment(cleaned, language)) {
    return { concept: 'let', variable: assignmentMatch[1], value: assignmentMatch[2] }
  }

  return null
}

function analyzeCall(cleaned) {
  const match = cleaned.match(/^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\((.*)\)$/)
  if (!match) return null

  return { concept: 'call', name: match[1], args: splitNames(match[2]) }
}

function splitNames(value = '') {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function composeExplanation({ details, line, level, context }) {
  const exact = describeExactLine(details, line)
  const involved = describeInvolved(details)
  const connection = describeConnection(details, context)
  const concept = describeConcept(details, level)

  return [exact, involved, connection, concept].filter(Boolean).join(' ')
}

function describeExactLine(details, line) {
  const code = line.trim()

  switch (details.concept) {
    case 'blank':
      return 'Blank line: it separates nearby code so the snippet is easier to scan.'
    case 'structure':
      return 'This structural line closes or separates a code block.'
    case 'comment':
      return `Comment: "${details.note}" is a note for the reader and does not run as code.`
    case 'import':
      return `This line imports ${formatList(details.imported) || details.module || 'external code'}${details.module ? ` from ${details.module}` : ''}.`
    case 'class':
      return `This line defines the class ${details.name || 'shown here'}, a blueprint for related data and behavior.`
    case 'function':
      return `This line defines ${details.isArrow ? 'the arrow function' : 'the function'} ${details.name || 'shown here'}${details.params?.length ? ` with parameter${plural(details.params)} ${formatList(details.params)}` : ''}.`
    case 'state':
      return `This line creates React state named ${details.variable} with setter ${details.setter} and initial value ${details.value || 'undefined'}.`
    case 'const':
    case 'let':
      return `This line stores ${details.value || 'a value'} in ${details.variable || 'a variable'}${details.type ? ` as type ${details.type}` : ''}.`
    case 'if':
      return `This line checks whether ${details.condition || code} is true before running the next block.`
    case 'for':
      return `This line starts a loop${details.variable ? ` using ${details.variable}` : ''}${details.source ? ` over ${details.source}` : ''}.`
    case 'return':
      return `This line returns ${details.value || 'a value'} to the place that called the current function.`
    case 'print':
      return `This line outputs ${details.value || 'a value'} so the user or developer can see it.`
    case 'api':
      return `This line makes or prepares an API/network request${details.name ? ` and stores the result in ${details.name}` : ''}.`
    case 'data':
      return `This line loads, parses, or transforms data${details.name ? ` into ${details.name}` : ''}.`
    case 'resource':
      return `This line safely opens or manages a resource${details.name ? ` as ${details.name}` : ''}.`
    case 'error':
      return 'This line starts or continues error-handling logic.'
    case 'async':
      return 'This line handles asynchronous work, usually waiting for something that finishes later.'
    case 'call':
      return `This line calls ${details.name}${details.args?.length ? ` with ${formatList(details.args)}` : ''}.`
    case 'expression':
      return `This line evaluates "${details.expression || code}" as part of the program flow.`
    default:
      return `This line runs: ${code}.`
  }
}

function describeInvolved(details) {
  const names = [
    details.name,
    details.variable,
    details.setter,
    details.module,
    ...(details.params ?? []),
    ...(details.imported ?? []),
  ].filter(Boolean)

  if (!names.length) return ''

  return `Involved name${plural(names)}: ${formatList(names)}.`
}

function describeConnection(details, context) {
  if (details.concept === 'blank') return ''

  const previous = context.previous?.trim()
  const next = context.next?.trim()

  if (details.concept === 'if') return 'The following indented or braced block runs only when this condition passes.'
  if (details.concept === 'for') return 'The next block is the repeated work controlled by this loop.'
  if (details.concept === 'function') return 'The next lines usually form the body of this function.'
  if (details.concept === 'return') return 'This often ends the current branch of the function.'
  if (previous && details.concept !== 'structure') return `It follows "${truncate(previous)}"${next ? ` and leads into "${truncate(next)}"` : ''}.`
  if (next) return `It sets up the next line: "${truncate(next)}".`

  return ''
}

function describeConcept(details, level) {
  const concise = {
    import: 'Imports reuse code instead of rewriting it.',
    state: 'React state lets the UI remember changing values.',
    function: 'Functions package repeatable behavior.',
    const: 'Use const when the binding should not be reassigned.',
    let: 'Use a variable when a value needs a name or may change later.',
    if: 'A condition creates a decision point.',
    for: 'A loop repeats the same logic for multiple values.',
    return: 'Return hands a result back to the caller.',
    class: 'A class groups related behavior and data.',
    print: 'Output is useful for feedback and debugging.',
    call: 'A function call runs previously defined behavior.',
    api: 'API requests let code communicate with external services.',
    data: 'Data code turns raw input into values the program can use.',
    resource: 'Resource management prevents files or connections from being left open.',
    error: 'Error handling keeps failures from crashing the program unexpectedly.',
    async: 'Async code is used for slow work such as network requests or file access.',
  }

  if (!concise[details.concept]) return ''
  if (level === 'advanced') return `Concept: ${concise[details.concept]}`
  if (level === 'intermediate') return `Concept: ${concise[details.concept]}`

  return `Beginner idea: ${concise[details.concept]}`
}

function plural(items) {
  return items.length === 1 ? '' : 's'
}

function formatList(items = []) {
  return items.filter(Boolean).join(', ')
}

function truncate(text) {
  return text.length > 70 ? `${text.slice(0, 67)}...` : text
}

export function translateCode({ code, codingLanguage, explanationLanguage, explanationLevel }) {
  const lines = code.split('\n')

  return lines.map((line, index) => {
    const details = analyzeLine(line, codingLanguage)

    // The current prototype keeps the explanation text in English so code names and logic stay precise.
    // This service is the only place that needs to change when a real translation endpoint is added.
    return {
      id: `${index + 1}-${details.concept}`,
      lineNumber: index + 1,
      code: line,
      concept: details.concept,
      details,
      explanationLanguage,
      explanation: composeExplanation({
        details,
        line,
        level: explanationLevel,
        context: {
          previous: lines[index - 1],
          next: lines[index + 1],
        },
      }),
    }
  })
}

export function detectCodingLanguage(code) {
  const text = code.trim()
  if (!text) return null

  const scores = {
    javascript: 0,
    python: 0,
    java: 0,
    cpp: 0,
  }

  addScore(scores, 'cpp', /^#include\b|std::|cout\s*<<|cin\s*>>|using namespace std|int\s+main\s*\(/gm, text, 4)
  addScore(scores, 'java', /\bpublic\s+class\b|\bclass\s+\w+\s*\{|System\.out\.println|public\s+static\s+void\s+main|String\[\]\s+args/gm, text, 4)
  addScore(scores, 'python', /^\s*(def|class|import|from|with|async\s+def)\b|:\s*$|print\(|self\.|requests\.|json\.|numpy\.|np\./gm, text, 3)
  addScore(scores, 'javascript', /\b(const|let|var)\b|=>|console\.log|import\s+.*\s+from\s+['"]|useState|export\s+default|function\s+\w+/gm, text, 3)

  if (/[{};]/.test(text)) {
    scores.javascript += 1
    scores.java += 1
    scores.cpp += 1
  }

  const [language, score] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return score > 0 ? language : null
}

function addScore(scores, language, pattern, text, weight) {
  const matches = text.match(pattern)
  if (matches) scores[language] += matches.length * weight
}

export function createStudyNotes({ code, codingLanguage, explanations, explanationLevel }) {
  const meaningful = explanations.filter((item) => !['blank', 'structure', 'comment'].includes(item.concept))
  const chunks = buildChunks(meaningful, explanationLevel)
  const glossary = buildGlossary({ code, explanations, codingLanguage, explanationLevel })

  return {
    summary: buildStudySummary({ code, codingLanguage, explanations: meaningful, explanationLevel }),
    chunks,
    glossary,
  }
}

function buildStudySummary({ code, codingLanguage, explanations, explanationLevel }) {
  const names = collectNames(explanations)
  const imports = collectImports(explanations)
  const functions = explanations.filter((item) => item.concept === 'function').map((item) => item.details.name).filter(Boolean)
  const returns = explanations.filter((item) => item.concept === 'return').map((item) => item.details.value).filter(Boolean)
  const output = explanations.find((item) => item.concept === 'print')?.details.value

  if (!code.trim()) return 'Paste or upload code, then translate it to generate study notes.'

  const subject = functions.length
    ? `builds ${functions.length === 1 ? `a helper called ${functions[0]}` : `helpers called ${functions.slice(0, 3).join(', ')}`}`
    : imports.length
      ? `uses ${imports.slice(0, 3).join(', ')} to set up the work`
      : `runs a short set of ${languageName(codingLanguage)} steps`

  const outcome = returns.length
    ? `In the end, it gives back ${returns[0]}.`
    : output
      ? `It shows ${output} as the result or check point.`
      : 'The chunks below show what each part is responsible for.'

  const beginnerSummary = `This ${languageName(codingLanguage)} code ${subject}. ${outcome}`
  const intermediateSummary = `${beginnerSummary} The important names to follow are ${names.slice(0, 4).join(', ') || 'the values created in each chunk'}.`
  const advancedSummary = `${intermediateSummary} Pay attention to where data enters, where it changes, and what result leaves the code.`

  if (explanationLevel === 'advanced') return advancedSummary
  if (explanationLevel === 'intermediate') return intermediateSummary
  return beginnerSummary
}

function buildChunks(explanations, explanationLevel) {
  const groups = []

  explanations.forEach((item) => {
    const category = chunkCategory(item)
    const last = groups[groups.length - 1]

    if (last?.category === category) {
      last.items.push(item)
      last.endLine = item.lineNumber
    } else {
      groups.push({
        id: `${category}-${item.lineNumber}`,
        category,
        title: chunkTitle(category),
        startLine: item.lineNumber,
        endLine: item.lineNumber,
        items: [item],
      })
    }
  })

  return groups.map((group) => {
    const names = collectNames(group.items)
    const concepts = unique(group.items.map((item) => item.concept).filter(Boolean))
    const lineRange = group.startLine === group.endLine ? `Line ${group.startLine}` : `Lines ${group.startLine}-${group.endLine}`

    return {
      ...group,
      lineRange,
      explanation: chunkExplanation(group, explanationLevel),
      why: chunkWhy(group, explanationLevel),
      keyItems: unique([...names, ...concepts.map(conceptLabel)]).slice(0, 8),
    }
  })
}

function chunkCategory(item) {
  if (item.concept === 'import') return 'imports'
  if (['const', 'let', 'state'].includes(item.concept)) return 'setup'
  if (['function', 'class'].includes(item.concept)) return 'definitions'
  if (item.concept === 'api') return 'api'
  if (['data', 'resource'].includes(item.concept)) return 'data'
  if (item.concept === 'error') return 'error'
  if (item.concept === 'async') return 'async'
  if (item.concept === 'for') return 'loops'
  if (['if', 'return', 'call', 'expression'].includes(item.concept)) return 'logic'
  if (item.concept === 'print') return 'output'

  return 'logic'
}

function chunkTitle(category) {
  const titles = {
    imports: 'Imports / Setup',
    setup: 'Configuration and Values',
    definitions: 'Function or Class Definition',
    data: 'Data Loading / Parsing',
    api: 'API Request',
    async: 'Async Work',
    loops: 'Loop / Repeated Work',
    logic: 'Main Logic',
    output: 'Output',
    error: 'Error Handling',
  }

  return titles[category] ?? 'Code Chunk'
}

function chunkExplanation(group, level) {
  const items = group.items
  const names = collectNames(items)
  const first = items[0]

  const base = {
    imports: `This chunk brings in ${collectImports(items).join(', ') || 'external code'} so later lines can use those tools.`,
    setup: `This chunk prepares ${names.join(', ') || 'the values'} used by the rest of the code.`,
    definitions: `This chunk defines ${names.join(', ') || 'reusable behavior'} for later use.`,
    data: `This chunk loads or shapes data${names.length ? ` into ${names.join(', ')}` : ''}.`,
    api: `This chunk talks to an external API or web resource${names.length ? ` and stores the result in ${names.join(', ')}` : ''}.`,
    async: 'This chunk waits for asynchronous work to finish before moving on.',
    loops: `This chunk repeats work${first.details.variable ? ` with ${first.details.variable}` : ''}${first.details.source ? ` over ${first.details.source}` : ''}.`,
    logic: `This chunk performs the main decision or data flow using ${names.join(', ') || 'the current values'}.`,
    output: `This chunk shows or logs ${first.details.value || 'the final value'}.`,
    error: 'This chunk handles possible failures or cleanup paths.',
  }[group.category]

  if (level === 'advanced') return `${base} Focus on the data flow, side effects, and returned values.`
  if (level === 'intermediate') return `${base} It connects earlier setup to the next meaningful step.`

  return base
}

function chunkWhy(group, level) {
  const why = {
    imports: 'Without this setup, referenced packages or helpers would not be available.',
    setup: 'Clear setup makes the later logic easier to read and change.',
    definitions: 'Definitions keep behavior reusable instead of writing the same logic repeatedly.',
    data: 'Most programs become useful only after data is loaded into a reliable shape.',
    api: 'API calls are where local code connects to outside data or services.',
    async: 'Async handling keeps the program responsive while slow operations finish.',
    loops: 'Loops make repeated work compact and less error-prone.',
    logic: 'This is where the code makes choices, transforms values, or decides what happens next.',
    output: 'Output lets the program communicate a result or helps you debug what happened.',
    error: 'Good error handling makes code safer when inputs, files, or network calls fail.',
  }[group.category]

  if (level === 'advanced') return `${why} Check whether this chunk mutates state, depends on external input, or exits early.`
  return why
}

function buildGlossary({ code, explanations, codingLanguage, explanationLevel }) {
  const terms = new Map()

  explanations.forEach((item) => {
    const details = item.details ?? {}
    if (conceptGlossary[item.concept]) terms.set(conceptLabel(item.concept), conceptGlossary[item.concept])
    if (details.kind === 'useState') terms.set('useState', packageGlossary.useState)
    if (details.module) terms.set(details.module, packageGlossary[details.module] ?? `${details.module} is a module or package used by this code.`)
    ;(details.imported ?? []).forEach((name) => {
      const cleanName = name.replace(/\s+as\s+\w+/, '').trim()
      if (packageGlossary[cleanName]) terms.set(cleanName, packageGlossary[cleanName])
    })
    ;(details.params ?? []).forEach((param) => {
      if (param.includes('args')) terms.set('args', conceptGlossary.args)
      if (param === 'self') terms.set('self', conceptGlossary.self)
    })
  })

  const keywordChecks = {
    with: /\bwith\b/,
    async: /\basync\b/,
    await: /\bawait\b/,
    return: /\breturn\b/,
    self: /\bself\b/,
    args: /\bargs\b|\*args\b|String\[\]\s+args/,
    requests: /\brequests\b/,
    json: /\bjson\b/,
    os: /\bos\b/,
    numpy: /\bnumpy\b|\bnp\./,
  }

  Object.entries(keywordChecks).forEach(([term, pattern]) => {
    if (pattern.test(code)) terms.set(term, packageGlossary[term] ?? conceptGlossary[term])
  })

  if (codingLanguage === 'cpp' && /std::|cout|cin/.test(code)) {
    terms.set('std / cout / cin', 'C++ standard-library names commonly used for console input and output.')
  }

  return Array.from(terms.entries()).slice(0, explanationLevel === 'advanced' ? 12 : 8).map(([term, definition]) => ({
    term,
    definition,
  }))
}

function collectNames(items) {
  return unique(
    items.flatMap((item) => {
      const details = item.details ?? {}
      return [
        details.name,
        details.variable,
        details.setter,
        details.value && /^[A-Za-z_]\w*$/.test(details.value) ? details.value : null,
        ...(details.params ?? []),
      ]
    }).filter(Boolean),
  )
}

function collectImports(items) {
  return unique(
    items
      .filter((item) => item.concept === 'import')
      .flatMap((item) => [item.details.module, ...(item.details.imported ?? [])])
      .filter(Boolean),
  )
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)))
}

export function summarizeCode({ code, codingLanguage, explanations }) {
  const nonBlankLines = explanations.filter((item) => !['blank', 'structure', 'comment'].includes(item.concept))
  const concepts = Array.from(new Set(nonBlankLines.map((item) => item.concept).filter((concept) => concept !== 'fallback')))
  const functionNames = code
    .split('\n')
    .map((line) => {
      const match = line.match(/\b(?:function|def)\s+([A-Za-z_]\w*)|([A-Za-z_]\w*)\s*=\s*\([^)]*\)\s*=>/)
      return match?.[1] ?? match?.[2]
    })
    .filter(Boolean)

  const purpose = buildPurposeSentence({ concepts, functionNames, codingLanguage })

  return {
    title: 'Code Summary',
    overview: purpose,
    bullets: [
      `Language selected: ${languageName(codingLanguage)}.`,
      `This snippet has ${nonBlankLines.length} meaningful code line${nonBlankLines.length === 1 ? '' : 's'}.`,
      concepts.length
        ? `Main concepts used: ${concepts.map((concept) => conceptLabel(concept)).join(', ')}.`
        : 'Main concepts used: general expressions and program structure.',
      buildFlowSentence(concepts),
      'Study tip: trace the values from the first line to each return, print, or final expression.',
    ],
  }
}

function buildPurposeSentence({ concepts, functionNames, codingLanguage }) {
  if (concepts.includes('function') && concepts.includes('return')) {
    const name = functionNames[0] ? ` named ${functionNames[0]}` : ''
    return `This ${languageName(codingLanguage)} code defines a reusable function${name}, makes decisions or prepares values, and returns a result that other code can use.`
  }

  if (concepts.includes('for')) {
    return `This ${languageName(codingLanguage)} code repeats work with a loop, which is useful when the same operation must run across multiple values.`
  }

  if (concepts.includes('class')) {
    return `This ${languageName(codingLanguage)} code defines a class, which organizes related data and behavior into a reusable structure.`
  }

  if (concepts.includes('print')) {
    return `This ${languageName(codingLanguage)} code produces visible output, which helps show a result or inspect what the program is doing.`
  }

  return `This ${languageName(codingLanguage)} code runs a small sequence of programming steps. Read it in order to see how values are created, checked, and used.`
}

function buildFlowSentence(concepts) {
  if (concepts.includes('if')) return 'Flow: the code can take different paths depending on a condition.'
  if (concepts.includes('for')) return 'Flow: the code repeats a block until the loop is finished.'
  if (concepts.includes('return')) return 'Flow: the code finishes by sending a value back to its caller.'

  return 'Flow: the code executes from top to bottom.'
}

function languageName(codingLanguage) {
  const names = {
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
  }

  return names[codingLanguage] ?? 'code'
}

function conceptLabel(concept) {
  const labels = {
    function: 'functions',
    const: 'constants',
    let: 'variables',
    if: 'conditionals',
    for: 'loops',
    return: 'return values',
    class: 'classes',
    import: 'imports',
    print: 'output',
    comment: 'comments',
    state: 'React state',
    call: 'function calls',
    api: 'API request',
    data: 'data loading',
    resource: 'resource handling',
    error: 'error handling',
    async: 'async work',
  }

  return labels[concept] ?? concept
}

export function createFlashcards(explanations) {
  const meaningfulLines = explanations.filter((item) => !['blank', 'structure', 'comment'].includes(item.concept))
  const conceptGroups = meaningfulLines.reduce((groups, item) => {
    const current = groups.get(item.concept) ?? []
    groups.set(item.concept, [...current, item])
    return groups
  }, new Map())

  const cards = Array.from(conceptGroups.entries()).flatMap(([concept, items]) => {
    const lineNumbers = items.map((item) => item.lineNumber).join(', ')
    const examples = items
      .map((item) => item.code.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(' | ')

    return buildConceptCards({ concept, lineNumbers, examples })
  })

  const codeSpecificCards = meaningfulLines.flatMap(buildCodeSpecificCards).slice(0, 10)
  const fullDeck = [...cards, ...codeSpecificCards]

  if (fullDeck.length) return fullDeck

  return [
    {
      id: 'program-flow-overview',
      front: 'How should you study this code chunk?',
      back: 'Read it from top to bottom, identify the inputs, find where values change, and trace what result comes out at the end.',
      status: 'new',
      tag: 'Study strategy',
    },
  ]
}

function buildConceptCards({ concept, lineNumbers, examples }) {
  const exampleText = examples ? ` In this code: ${examples}` : ''
  const lineText = lineNumbers ? ` Related lines: ${lineNumbers}.` : ''

  const conceptCards = {
    function: [
      {
        front: 'What does a function help you do?',
        back: `A function packages a task so you can run it again with different inputs instead of rewriting the same logic.${lineText}${exampleText}`,
      },
      {
        front: 'How do you apply this idea in real projects?',
        back: 'Use functions when one piece of behavior has a clear name, a small purpose, and may be reused or tested on its own.',
      },
    ],
    const: [
      {
        front: 'When should you use a constant value?',
        back: `Use a constant when the variable should keep the same assigned value, which makes the code easier to reason about.${lineText}${exampleText}`,
      },
    ],
    let: [
      {
        front: 'When should a variable be changeable?',
        back: `Use a changeable variable only when the value needs to update over time, such as a counter, accumulator, or temporary state.${lineText}${exampleText}`,
      },
    ],
    if: [
      {
        front: 'What is the purpose of a conditional?',
        back: `A conditional lets the program choose a path based on whether a condition is true or false.${lineText}${exampleText}`,
      },
      {
        front: 'How can you test conditional logic?',
        back: 'Try one input that makes the condition true and another input that makes it false, then compare the different outcomes.',
      },
    ],
    for: [
      {
        front: 'What problem does a loop solve?',
        back: `A loop repeats work without copying the same line many times, usually across a range, list, or repeated condition.${lineText}${exampleText}`,
      },
    ],
    return: [
      {
        front: 'Why does returning a value matter?',
        back: `A return statement sends the result of a function back to the caller so the rest of the program can use it.${lineText}${exampleText}`,
      },
    ],
    class: [
      {
        front: 'What does a class organize?',
        back: `A class groups related data and behavior into a reusable blueprint for objects.${lineText}${exampleText}`,
      },
    ],
    import: [
      {
        front: 'Why import code from elsewhere?',
        back: `Imports let you reuse libraries or code from other files, keeping each file smaller and more focused.${lineText}${exampleText}`,
      },
    ],
    print: [
      {
        front: 'Why print or log values while learning?',
        back: `Printing helps you inspect what the program knows at a specific moment, which is useful for debugging and tracing flow.${lineText}${exampleText}`,
      },
    ],
    comment: [
      {
        front: 'What makes a comment useful?',
        back: `A useful comment explains why the code exists or clarifies an idea that is not obvious from the code itself.${lineText}${exampleText}`,
      },
    ],
    state: [
      {
        front: 'What does React state store?',
        back: `React state stores a value that can change and cause the UI to update when its setter runs.${lineText}${exampleText}`,
      },
    ],
    call: [
      {
        front: 'What does a function call do?',
        back: `A function call runs named behavior and passes any arguments into it.${lineText}${exampleText}`,
      },
    ],
    expression: [
      {
        front: 'How should you read a standalone expression?',
        back: `Check which value it computes or which object it changes, then connect it to the surrounding lines.${lineText}${exampleText}`,
      },
    ],
    api: [
      {
        front: 'What does an API request do?',
        back: `It asks another service for data or sends data to it, often over HTTP.${lineText}${exampleText}`,
      },
    ],
    data: [
      {
        front: 'Why is data loading/parsing important?',
        back: `It turns raw input into values the rest of the program can use safely.${lineText}${exampleText}`,
      },
    ],
    resource: [
      {
        front: 'Why use safe resource handling?',
        back: `It helps files, connections, or streams close correctly after the code finishes using them.${lineText}${exampleText}`,
      },
    ],
    error: [
      {
        front: 'Why add error handling?',
        back: `It lets the program respond when a file, input, or network request fails.${lineText}${exampleText}`,
      },
    ],
    async: [
      {
        front: 'What does async code help with?',
        back: `It handles work that finishes later, such as network requests, without blocking the rest of the program.${lineText}${exampleText}`,
      },
    ],
  }

  return (conceptCards[concept] ?? []).map((card, index) => ({
    ...card,
    id: `${concept}-${index + 1}`,
    status: 'new',
    tag: concept,
  }))
}

function buildCodeSpecificCards(item) {
  const details = item.details ?? {}
  const lineText = `Line ${item.lineNumber}: ${item.code.trim()}`

  switch (item.concept) {
    case 'state':
      return [
        {
          id: `specific-state-${item.lineNumber}`,
          front: `What does ${details.variable} store in this component?`,
          back: `${details.variable} stores the state initialized with ${details.value || 'undefined'}, and ${details.setter} is the function used to update it. ${lineText}`,
          status: 'new',
          tag: 'code-specific',
        },
      ]
    case 'const':
    case 'let':
      return [
        {
          id: `specific-var-${item.lineNumber}`,
          front: `What does ${details.variable || 'this variable'} store here?`,
          back: `${details.variable || 'This variable'} stores ${details.value || 'the value from the right side of the assignment'}. ${lineText}`,
          status: 'new',
          tag: 'code-specific',
        },
      ]
    case 'function':
      return [
        {
          id: `specific-function-${item.lineNumber}`,
          front: `What inputs does ${details.name || 'this function'} receive?`,
          back: `${details.name || 'This function'} receives ${details.params?.length ? formatList(details.params) : 'no named parameters'} and uses the following block as its body. ${lineText}`,
          status: 'new',
          tag: 'code-specific',
        },
      ]
    case 'return':
      return [
        {
          id: `specific-return-${item.lineNumber}`,
          front: 'What value does this code return?',
          back: `It returns ${details.value || 'the expression on the right side of return'} to the caller. ${lineText}`,
          status: 'new',
          tag: 'code-specific',
        },
      ]
    case 'if':
      return [
        {
          id: `specific-if-${item.lineNumber}`,
          front: 'What condition decides whether the next block runs?',
          back: `The condition is ${details.condition || 'shown in the if statement'}. If it is true, the following block runs. ${lineText}`,
          status: 'new',
          tag: 'code-specific',
        },
      ]
    case 'for':
      return [
        {
          id: `specific-loop-${item.lineNumber}`,
          front: `What controls this loop${details.variable ? ` with ${details.variable}` : ''}?`,
          back: `The loop is controlled by ${details.source || 'the expression inside the for statement'}. ${lineText}`,
          status: 'new',
          tag: 'code-specific',
        },
      ]
    case 'import':
      return [
        {
          id: `specific-import-${item.lineNumber}`,
          front: `What does this import make available?`,
          back: `It makes ${formatList(details.imported) || details.module || 'the imported module'} available for later code. ${lineText}`,
          status: 'new',
          tag: 'code-specific',
        },
      ]
    case 'call':
      return [
        {
          id: `specific-call-${item.lineNumber}`,
          front: `What does calling ${details.name} do here?`,
          back: `It runs ${details.name}${details.args?.length ? ` with ${formatList(details.args)}` : ''}. ${lineText}`,
          status: 'new',
          tag: 'code-specific',
        },
      ]
    case 'api':
      return [
        {
          id: `specific-api-${item.lineNumber}`,
          front: `What API or network action happens on line ${item.lineNumber}?`,
          back: `The code runs ${details.expression || item.code.trim()}${details.name ? ` and stores the result in ${details.name}` : ''}.`,
          status: 'new',
          tag: 'code-specific',
        },
      ]
    case 'data':
    case 'resource':
      return [
        {
          id: `specific-data-${item.lineNumber}`,
          front: `What data/resource step happens on line ${item.lineNumber}?`,
          back: `The code runs ${details.expression || item.code.trim()}${details.name ? ` and names the result ${details.name}` : ''}.`,
          status: 'new',
          tag: 'code-specific',
        },
      ]
    default:
      return []
  }
}
