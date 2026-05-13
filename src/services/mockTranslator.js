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

const packageGlossaryZh = {
  requests: '一个用于发送 HTTP 请求、从网站或 API 获取数据的 Python 库。',
  json: '一个用于读取和写入 JSON 数据的 Python 模块。',
  os: '一个用于处理文件、文件夹、路径和环境变量的 Python 模块。',
  numpy: '一个用于数值计算和数组操作的 Python 库。',
  pandas: '一个用于处理表格型数据的 Python 库。',
  matplotlib: '一个用于创建图表和可视化的 Python 库。',
  react: '一个用于用组件构建用户界面的 JavaScript 库。',
  useState: '一个 React hook，用来保存会变化的值，并提供更新它的 setter 函数。',
  iostream: '一个 C++ 标准库头文件，常用于控制台输入和输出。',
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

const conceptGlossaryZh = {
  import: '把其他模块、包或库里的代码带进当前文件使用。',
  function: '一段有名字、可重复使用的逻辑，可以接收输入，也可以返回结果。',
  class: '把相关数据和行为组织在一起的蓝图。',
  state: '界面中会随时间变化，并能触发组件更新的值。',
  const: '一个名字对应的值；这个名字本身不应该被重新指向别的值。',
  let: '一个之后可能会变化的变量。',
  if: '一个判断点：条件成立时才运行对应代码块。',
  for: '一种循环，用来重复执行一段代码。',
  return: '把结果交回给调用当前函数的地方。',
  print: '把值显示或输出出来，方便看到程序在做什么。',
  call: '运行一个已经存在的函数，并可传入参数。',
  async: '表示代码会处理异步任务。',
  await: '让 async 代码等待一个 Promise 或异步任务完成。',
  with: 'Python 中用于安全打开和关闭资源的关键字，比如文件。',
  self: 'Python 类方法中表示当前对象的名字。',
  args: 'arguments 的缩写，表示传给函数或命令的值。',
  api: '准备或发送请求，与外部服务交换数据的代码。',
  data: '加载、解析、清洗或调整数据结构的代码。',
  resource: '安全管理文件、网络连接等资源的代码。',
  error: '处理失败情况，让程序更稳定的代码。',
}

function isChinese(outputLanguage) {
  return outputLanguage === 'chinese'
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

function composeExplanation({ details, line, outputLanguage, context }) {
  const exact = describeExactLine(details, line, outputLanguage)
  const involved = describeInvolved(details, outputLanguage)
  const connection = describeConnection(details, context, outputLanguage)
  const concept = describeConcept(details, outputLanguage)

  return [exact, involved, connection, concept].filter(Boolean).join(' ')
}

function describeExactLine(details, line, outputLanguage) {
  if (isChinese(outputLanguage)) return describeExactLineZh(details, line)

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

function describeExactLineZh(details, line) {
  const code = line.trim()

  switch (details.concept) {
    case 'blank':
      return '空行：它把相邻代码分开，让片段更容易阅读。'
    case 'structure':
      return '这一行是结构符号，用来结束或分隔一个代码块。'
    case 'comment':
      return `注释：“${details.note}” 是给读代码的人看的说明，不会作为代码运行。`
    case 'import':
      return `这一行导入 ${formatList(details.imported) || details.module || '外部代码'}${details.module ? `，来源是 ${details.module}` : ''}。`
    case 'class':
      return `这一行定义 class ${details.name || '这里的类'}，它像一个蓝图，用来组织相关数据和行为。`
    case 'function':
      return `这一行定义 ${details.isArrow ? 'arrow function' : 'function'} ${details.name || '这里的函数'}${details.params?.length ? `，参数是 ${formatList(details.params)}` : ''}。`
    case 'state':
      return `这一行创建 React state：${details.variable}，并用 ${details.setter} 来更新它，初始值是 ${details.value || 'undefined'}。`
    case 'const':
    case 'let':
      return `这一行把 ${details.value || '一个值'} 存到 ${details.variable || '一个变量'} 里${details.type ? `，类型是 ${details.type}` : ''}。`
    case 'if':
      return `这一行检查 ${details.condition || code} 是否成立；成立时才运行后面的代码块。`
    case 'for':
      return `这一行开始一个 for loop${details.variable ? `，循环变量是 ${details.variable}` : ''}${details.source ? `，遍历的是 ${details.source}` : ''}。`
    case 'return':
      return `这一行把 ${details.value || '一个值'} 返回给调用当前 function 的地方。`
    case 'print':
      return `这一行输出 ${details.value || '一个值'}，让用户或开发者看到结果。`
    case 'api':
      return `这一行发起或准备 API/网络请求${details.name ? `，并把结果存到 ${details.name}` : ''}。`
    case 'data':
      return `这一行加载、解析或转换数据${details.name ? `，并放进 ${details.name}` : ''}。`
    case 'resource':
      return `这一行安全地打开或管理资源${details.name ? `，名字是 ${details.name}` : ''}。`
    case 'error':
      return '这一行开始或继续处理错误情况。'
    case 'async':
      return '这一行处理异步任务，通常是在等待稍后才完成的事情。'
    case 'call':
      return `这一行调用 ${details.name}${details.args?.length ? `，传入 ${formatList(details.args)}` : ''}。`
    case 'expression':
      return `这一行执行表达式 “${details.expression || code}”，它是程序流程的一部分。`
    default:
      return `这一行会运行：${code}。`
  }
}

function describeInvolved(details, outputLanguage) {
  const names = [
    details.name,
    details.variable,
    details.setter,
    details.module,
    ...(details.params ?? []),
    ...(details.imported ?? []),
  ].filter(Boolean)

  if (!names.length) return ''

  if (isChinese(outputLanguage)) return `相关名字：${formatList(names)}。`
  return `Involved name${plural(names)}: ${formatList(names)}.`
}

function describeConnection(details, context, outputLanguage) {
  if (details.concept === 'blank') return ''

  const previous = context.previous?.trim()
  const next = context.next?.trim()

  if (isChinese(outputLanguage)) {
    if (details.concept === 'if') return '后面缩进或大括号里的代码块，只有在这个条件成立时才会运行。'
    if (details.concept === 'for') return '接下来的代码块是这个 loop 控制的重复工作。'
    if (details.concept === 'function') return '接下来的几行通常就是这个 function 的主体。'
    if (details.concept === 'return') return '这通常会结束当前 function 分支，并把结果交回去。'
    if (previous && details.concept !== 'structure') return `它接在 “${truncate(previous)}” 后面${next ? `，并引出 “${truncate(next)}”` : ''}。`
    if (next) return `它为下一行 “${truncate(next)}” 做准备。`
    return ''
  }

  if (details.concept === 'if') return 'The following indented or braced block runs only when this condition passes.'
  if (details.concept === 'for') return 'The next block is the repeated work controlled by this loop.'
  if (details.concept === 'function') return 'The next lines usually form the body of this function.'
  if (details.concept === 'return') return 'This often ends the current branch of the function.'
  if (previous && details.concept !== 'structure') return `It follows "${truncate(previous)}"${next ? ` and leads into "${truncate(next)}"` : ''}.`
  if (next) return `It sets up the next line: "${truncate(next)}".`

  return ''
}

function describeConcept(details, outputLanguage) {
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
  if (isChinese(outputLanguage)) {
    const zh = {
      import: 'import 可以复用已有代码，不需要从零重写。',
      state: 'React state 让界面记住会变化的值。',
      function: 'function 把可重复的行为打包起来。',
      const: 'const 适合用在这个名字不应该重新指向其他值的时候。',
      let: '变量让一个值有名字，之后也可以根据需要更新。',
      if: '条件判断让程序可以做选择。',
      for: 'loop 可以对多个值重复同样的逻辑。',
      return: 'return 把结果交回给调用者。',
      class: 'class 把相关行为和数据组织在一起。',
      print: '输出可以帮助你看到结果，也方便调试。',
      call: 'function call 会运行已经定义好的行为。',
      api: 'API 请求让本地代码和外部服务交换数据。',
      data: '数据代码会把原始输入变成程序能使用的值。',
      resource: '资源管理可以避免文件或连接一直开着。',
      error: '错误处理让程序在失败时更稳定。',
      async: 'async code 用来处理网络请求、文件读取等比较慢的任务。',
    }

    return `初学者理解：${zh[details.concept]}`
  }

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

export function translateCode({ code, codingLanguage, explanationLanguage }) {
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
        outputLanguage: explanationLanguage,
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

export function createStudyNotes({
  code,
  codingLanguage,
  explanations,
  explanationLanguage = explanations[0]?.explanationLanguage ?? 'english',
}) {
  const meaningful = explanations.filter((item) => !['blank', 'structure', 'comment'].includes(item.concept))
  const chunks = buildChunks(meaningful, explanationLanguage)
  const glossary = buildGlossary({ code, explanations, codingLanguage, explanationLanguage })

  return {
    summary: buildStudySummary({ code, codingLanguage, explanations: meaningful, explanationLanguage }),
    chunks,
    glossary,
  }
}

function buildStudySummary({ code, codingLanguage, explanations, explanationLanguage }) {
  const names = collectNames(explanations)
  const imports = collectImports(explanations)
  const functions = explanations.filter((item) => item.concept === 'function').map((item) => item.details.name).filter(Boolean)
  const returns = explanations.filter((item) => item.concept === 'return').map((item) => item.details.value).filter(Boolean)
  const output = explanations.find((item) => item.concept === 'print')?.details.value

  if (!code.trim()) {
    return isChinese(explanationLanguage)
      ? '先粘贴或上传代码，然后点击翻译来生成学习笔记。'
      : 'Paste or upload code, then translate it to generate study notes.'
  }

  if (isChinese(explanationLanguage)) {
    const subject = functions.length
      ? `定义了${functions.length === 1 ? `一个叫 ${functions[0]} 的 helper function` : `几个 helper functions：${functions.slice(0, 3).join(', ')}`}`
      : imports.length
        ? `使用 ${imports.slice(0, 3).join(', ')} 来准备后面的工作`
        : `运行一小段 ${languageName(codingLanguage)} 步骤`

    const outcome = returns.length
      ? `最后，它会返回 ${returns[0]}。`
      : output
        ? `它会显示 ${output}，作为结果或检查点。`
        : '下面的分块会说明每一部分负责什么。'

    const namesText = names.slice(0, 4).join(', ')
    return `这段 ${languageName(codingLanguage)} 代码${subject}。${outcome}${namesText ? ` 可以重点跟踪这些名字：${namesText}。` : ''}`
  }

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

  const namesText = names.slice(0, 4).join(', ')
  return `${`This ${languageName(codingLanguage)} code ${subject}. ${outcome}`}${namesText ? ` The important names to follow are ${namesText}.` : ''}`
}

function buildChunks(explanations, explanationLanguage) {
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
    const lineRange = group.startLine === group.endLine
      ? `${isChinese(explanationLanguage) ? '第' : 'Line '}${group.startLine}${isChinese(explanationLanguage) ? ' 行' : ''}`
      : isChinese(explanationLanguage)
        ? `第 ${group.startLine}-${group.endLine} 行`
        : `Lines ${group.startLine}-${group.endLine}`

    return {
      ...group,
      lineRange,
      title: chunkTitle(group.category, explanationLanguage),
      explanation: chunkExplanation(group, explanationLanguage),
      why: chunkWhy(group, explanationLanguage),
      keyItems: unique([...names, ...concepts.map((concept) => conceptLabel(concept, explanationLanguage))]).slice(0, 8),
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

function chunkTitle(category, outputLanguage = 'english') {
  if (isChinese(outputLanguage)) {
    const titles = {
      imports: '导入 / 准备',
      setup: '配置和变量',
      definitions: 'Function 或 Class 定义',
      data: '数据加载 / 解析',
      api: 'API 请求',
      async: '异步任务',
      loops: 'Loop / 重复工作',
      logic: '主要逻辑',
      output: '输出',
      error: '错误处理',
    }

    return titles[category] ?? '代码片段'
  }

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

function chunkExplanation(group, outputLanguage) {
  const items = group.items
  const names = collectNames(items)
  const first = items[0]

  if (isChinese(outputLanguage)) {
    return {
      imports: `这一块导入 ${collectImports(items).join(', ') || '外部代码'}，让后面的代码可以使用这些工具。`,
      setup: `这一块准备 ${names.join(', ') || '后面会用到的值'}。`,
      definitions: `这一块定义 ${names.join(', ') || '可重复使用的行为'}，供后面调用。`,
      data: `这一块加载或整理数据${names.length ? `，并放到 ${names.join(', ')}` : ''}。`,
      api: `这一块和外部 API 或网络资源交互${names.length ? `，并把结果存到 ${names.join(', ')}` : ''}。`,
      async: '这一块会等待异步任务完成，然后再继续往下走。',
      loops: `这一块重复执行工作${first.details.variable ? `，循环变量是 ${first.details.variable}` : ''}${first.details.source ? `，遍历的是 ${first.details.source}` : ''}。`,
      logic: `这一块用 ${names.join(', ') || '当前值'} 完成主要判断或数据流。`,
      output: `这一块显示或记录 ${first.details.value || '最终值'}。`,
      error: '这一块处理可能出现的失败或清理流程。',
    }[group.category]
  }

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

  return base
}

function chunkWhy(group, outputLanguage) {
  if (isChinese(outputLanguage)) {
    return {
      imports: '没有这些准备，后面引用的包或 helper 就不能使用。',
      setup: '清楚的准备步骤能让后面的逻辑更容易读懂和修改。',
      definitions: '定义可以复用行为，不用反复写同样的逻辑。',
      data: '很多程序只有在数据被读入并整理成可靠结构后才有用。',
      api: 'API 调用是本地代码连接外部数据或服务的地方。',
      async: '异步处理能让程序在等待慢任务时保持响应。',
      loops: 'Loop 让重复工作更简洁，也更不容易复制出错。',
      logic: '这里通常是代码做选择、改变值或决定下一步的地方。',
      output: '输出能让程序展示结果，也能帮助你调试。',
      error: '好的错误处理能让输入、文件或网络失败时程序更安全。',
    }[group.category]
  }

  return {
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
}

function buildGlossary({ code, explanations, codingLanguage, explanationLanguage }) {
  const terms = new Map()
  const conceptDefinitions = isChinese(explanationLanguage) ? conceptGlossaryZh : conceptGlossary
  const packageDefinitions = isChinese(explanationLanguage) ? packageGlossaryZh : packageGlossary

  explanations.forEach((item) => {
    const details = item.details ?? {}
    if (conceptDefinitions[item.concept]) terms.set(conceptLabel(item.concept, explanationLanguage), conceptDefinitions[item.concept])
    if (details.kind === 'useState') terms.set('useState', packageDefinitions.useState)
    if (details.module) {
      terms.set(
        details.module,
        packageDefinitions[details.module] ??
          (isChinese(explanationLanguage)
            ? `${details.module} 是这段代码使用的模块或包。`
            : `${details.module} is a module or package used by this code.`),
      )
    }
    ;(details.imported ?? []).forEach((name) => {
      const cleanName = name.replace(/\s+as\s+\w+/, '').trim()
      if (packageDefinitions[cleanName]) terms.set(cleanName, packageDefinitions[cleanName])
    })
    ;(details.params ?? []).forEach((param) => {
      if (param.includes('args')) terms.set('args', conceptDefinitions.args)
      if (param === 'self') terms.set('self', conceptDefinitions.self)
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
    if (pattern.test(code)) terms.set(term, packageDefinitions[term] ?? conceptDefinitions[term])
  })

  if (codingLanguage === 'cpp' && /std::|cout|cin/.test(code)) {
    terms.set(
      'std / cout / cin',
      isChinese(explanationLanguage)
        ? 'C++ 标准库里常用于控制台输入和输出的名字。'
        : 'C++ standard-library names commonly used for console input and output.',
    )
  }

  return Array.from(terms.entries()).slice(0, 8).map(([term, definition]) => ({
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

export function summarizeCode({ code, codingLanguage, explanations, explanationLanguage = 'english' }) {
  const nonBlankLines = explanations.filter((item) => !['blank', 'structure', 'comment'].includes(item.concept))
  const concepts = Array.from(new Set(nonBlankLines.map((item) => item.concept).filter((concept) => concept !== 'fallback')))
  const functionNames = code
    .split('\n')
    .map((line) => {
      const match = line.match(/\b(?:function|def)\s+([A-Za-z_]\w*)|([A-Za-z_]\w*)\s*=\s*\([^)]*\)\s*=>/)
      return match?.[1] ?? match?.[2]
    })
    .filter(Boolean)

  const purpose = buildPurposeSentence({ concepts, functionNames, codingLanguage, explanationLanguage })

  if (isChinese(explanationLanguage)) {
    return {
      title: '代码总结',
      overview: purpose,
      bullets: [
        `代码语言：${languageName(codingLanguage)}。`,
        `这段代码有 ${nonBlankLines.length} 行有意义的代码。`,
        concepts.length
          ? `主要概念：${concepts.map((concept) => conceptLabel(concept, explanationLanguage)).join('、')}。`
          : '主要概念：一般表达式和程序结构。',
        buildFlowSentence(concepts, explanationLanguage),
        '学习提示：从第一行开始，跟踪每个值如何到达 return、print 或最终表达式。',
      ],
    }
  }

  return {
    title: 'Code Summary',
    overview: purpose,
    bullets: [
      `Language selected: ${languageName(codingLanguage)}.`,
      `This snippet has ${nonBlankLines.length} meaningful code line${nonBlankLines.length === 1 ? '' : 's'}.`,
      concepts.length
        ? `Main concepts used: ${concepts.map((concept) => conceptLabel(concept, explanationLanguage)).join(', ')}.`
        : 'Main concepts used: general expressions and program structure.',
      buildFlowSentence(concepts, explanationLanguage),
      'Study tip: trace the values from the first line to each return, print, or final expression.',
    ],
  }
}

function buildPurposeSentence({ concepts, functionNames, codingLanguage, explanationLanguage = 'english' }) {
  if (isChinese(explanationLanguage)) {
    if (concepts.includes('function') && concepts.includes('return')) {
      const name = functionNames[0] ? `，名字是 ${functionNames[0]}` : ''
      return `这段 ${languageName(codingLanguage)} 代码定义了一个可复用的 function${name}，会准备或判断一些值，并返回一个结果给其他代码使用。`
    }

    if (concepts.includes('for')) {
      return `这段 ${languageName(codingLanguage)} 代码用 loop 重复执行工作，适合对多个值做同样的操作。`
    }

    if (concepts.includes('class')) {
      return `这段 ${languageName(codingLanguage)} 代码定义了一个 class，用来把相关数据和行为组织成可复用结构。`
    }

    if (concepts.includes('print')) {
      return `这段 ${languageName(codingLanguage)} 代码会产生可见输出，帮助展示结果或检查程序状态。`
    }

    return `这段 ${languageName(codingLanguage)} 代码运行一小组步骤。按顺序阅读，可以看到值如何被创建、检查和使用。`
  }

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

function buildFlowSentence(concepts, outputLanguage = 'english') {
  if (isChinese(outputLanguage)) {
    if (concepts.includes('if')) return '流程：代码会根据条件走不同路径。'
    if (concepts.includes('for')) return '流程：代码会重复运行一个代码块，直到 loop 结束。'
    if (concepts.includes('return')) return '流程：代码最后会把一个值返回给调用者。'

    return '流程：代码从上到下执行。'
  }

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

function conceptLabel(concept, outputLanguage = 'english') {
  if (isChinese(outputLanguage)) {
    const labels = {
      function: 'functions',
      const: '常量',
      let: '变量',
      if: '条件判断',
      for: 'loops',
      return: 'return 值',
      class: 'classes',
      import: 'imports',
      print: '输出',
      comment: '注释',
      state: 'React state',
      call: 'function calls',
      api: 'API 请求',
      data: '数据加载',
      resource: '资源处理',
      error: '错误处理',
      async: '异步任务',
    }

    return labels[concept] ?? concept
  }

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
  const outputLanguage = explanations[0]?.explanationLanguage ?? 'english'
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

    return buildConceptCards({ concept, lineNumbers, examples, outputLanguage })
  })

  const codeSpecificCards = meaningfulLines.flatMap((item) => buildCodeSpecificCards(item, outputLanguage)).slice(0, 10)
  const fullDeck = [...cards, ...codeSpecificCards]

  if (fullDeck.length) return fullDeck

  return [
    {
      id: 'program-flow-overview',
      front: isChinese(outputLanguage) ? '应该怎样学习这段代码？' : 'How should you study this code chunk?',
      back: isChinese(outputLanguage)
        ? '从上到下读，找出输入是什么、值在哪里变化，以及最后产生什么结果。'
        : 'Read it from top to bottom, identify the inputs, find where values change, and trace what result comes out at the end.',
      status: 'new',
      tag: isChinese(outputLanguage) ? '学习方法' : 'Study strategy',
    },
  ]
}

function buildConceptCards({ concept, lineNumbers, examples, outputLanguage }) {
  const exampleText = examples
    ? isChinese(outputLanguage)
      ? ` 这段代码里的例子：${examples}`
      : ` In this code: ${examples}`
    : ''
  const lineText = lineNumbers
    ? isChinese(outputLanguage)
      ? ` 相关行：${lineNumbers}。`
      : ` Related lines: ${lineNumbers}.`
    : ''

  if (isChinese(outputLanguage)) {
    const conceptCards = {
      function: [
        {
          front: 'function 能帮你做什么？',
          back: `function 会把一个任务打包起来，让你可以用不同输入重复运行，而不用复制同样的代码。${lineText}${exampleText}`,
        },
        {
          front: '什么时候应该写成 function？',
          back: '当一段行为有清楚的名字、目的很小，并且可能被复用或单独测试时，就适合写成 function。',
        },
      ],
      const: [
        {
          front: '什么时候适合用 const？',
          back: `当这个名字不应该重新指向另一个值时，用 const 可以让代码更容易理解。${lineText}${exampleText}`,
        },
      ],
      let: [
        {
          front: '什么时候变量需要可以改变？',
          back: `当值会随着流程更新时，比如计数器、累加器或临时状态，就需要可变化的变量。${lineText}${exampleText}`,
        },
      ],
      if: [
        {
          front: '条件判断的作用是什么？',
          back: `条件判断让程序根据 true 或 false 选择不同路径。${lineText}${exampleText}`,
        },
        {
          front: '怎样测试 if 逻辑？',
          back: '准备一个让条件成立的输入，再准备一个不成立的输入，然后比较两个结果。',
        },
      ],
      for: [
        {
          front: 'loop 解决什么问题？',
          back: `loop 可以重复执行工作，而不用把同一行代码复制很多次。${lineText}${exampleText}`,
        },
      ],
      return: [
        {
          front: '为什么 return 很重要？',
          back: `return 会把 function 的结果交回给调用者，让程序后面可以继续使用这个结果。${lineText}${exampleText}`,
        },
      ],
      class: [
        {
          front: 'class 用来组织什么？',
          back: `class 会把相关数据和行为放进一个可复用蓝图里。${lineText}${exampleText}`,
        },
      ],
      import: [
        {
          front: '为什么要 import 代码？',
          back: `import 可以复用库或其他文件里的代码，让当前文件更小、更专注。${lineText}${exampleText}`,
        },
      ],
      print: [
        {
          front: '学习时为什么要 print 或 log？',
          back: `输出可以帮助你看到程序在某一刻知道什么，适合调试和跟踪流程。${lineText}${exampleText}`,
        },
      ],
      comment: [
        {
          front: '什么样的注释有帮助？',
          back: `好的注释解释为什么要这样写，或说明代码本身不容易看出的想法。${lineText}${exampleText}`,
        },
      ],
      state: [
        {
          front: 'React state 保存什么？',
          back: `React state 保存会变化的值；setter 运行后，界面会根据新值更新。${lineText}${exampleText}`,
        },
      ],
      call: [
        {
          front: 'function call 会做什么？',
          back: `function call 会运行已经定义好的行为，并把参数传进去。${lineText}${exampleText}`,
        },
      ],
      expression: [
        {
          front: '怎样读一个单独的表达式？',
          back: `先看它算出什么值，或改变了哪个对象，再把它连接到周围代码。${lineText}${exampleText}`,
        },
      ],
      api: [
        {
          front: 'API 请求做什么？',
          back: `它会通过网络向另一个服务发送或请求数据。${lineText}${exampleText}`,
        },
      ],
      data: [
        {
          front: '为什么数据加载/解析重要？',
          back: `它会把原始输入变成程序能安全使用的值。${lineText}${exampleText}`,
        },
      ],
      resource: [
        {
          front: '为什么要安全处理资源？',
          back: `这样文件、连接或 stream 用完后可以正确关闭。${lineText}${exampleText}`,
        },
      ],
      error: [
        {
          front: '为什么要处理错误？',
          back: `当文件、输入或网络请求失败时，错误处理能让程序有办法回应。${lineText}${exampleText}`,
        },
      ],
      async: [
        {
          front: 'async code 帮助处理什么？',
          back: `它处理稍后才完成的任务，比如网络请求，同时避免卡住其他代码。${lineText}${exampleText}`,
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

function buildCodeSpecificCards(item, outputLanguage = 'english') {
  const details = item.details ?? {}
  const lineText = isChinese(outputLanguage)
    ? `第 ${item.lineNumber} 行：${item.code.trim()}`
    : `Line ${item.lineNumber}: ${item.code.trim()}`

  if (isChinese(outputLanguage)) {
    switch (item.concept) {
      case 'state':
        return [
          {
            id: `specific-state-${item.lineNumber}`,
            front: `${details.variable} 在这个组件里保存什么？`,
            back: `${details.variable} 保存初始值 ${details.value || 'undefined'}，${details.setter} 是用来更新它的函数。${lineText}`,
            status: 'new',
            tag: 'code-specific',
          },
        ]
      case 'const':
      case 'let':
        return [
          {
            id: `specific-var-${item.lineNumber}`,
            front: `${details.variable || '这个变量'} 在这里保存什么？`,
            back: `${details.variable || '这个变量'} 保存等号右边的值：${details.value || '当前表达式'}。${lineText}`,
            status: 'new',
            tag: 'code-specific',
          },
        ]
      case 'function':
        return [
          {
            id: `specific-function-${item.lineNumber}`,
            front: `${details.name || '这个 function'} 接收哪些输入？`,
            back: `${details.name || '这个 function'} 接收 ${details.params?.length ? formatList(details.params) : '没有命名参数'}，后面的代码块就是它的主体。${lineText}`,
            status: 'new',
            tag: 'code-specific',
          },
        ]
      case 'return':
        return [
          {
            id: `specific-return-${item.lineNumber}`,
            front: '这行代码 return 什么值？',
            back: `它把 ${details.value || 'return 右边的表达式'} 返回给调用者。${lineText}`,
            status: 'new',
            tag: 'code-specific',
          },
        ]
      case 'if':
        return [
          {
            id: `specific-if-${item.lineNumber}`,
            front: '是什么条件决定后面的代码块是否运行？',
            back: `条件是 ${details.condition || 'if 语句里显示的表达式'}。如果条件成立，后面的代码块就会运行。${lineText}`,
            status: 'new',
            tag: 'code-specific',
          },
        ]
      case 'for':
        return [
          {
            id: `specific-loop-${item.lineNumber}`,
            front: `这个 loop 由什么控制${details.variable ? `，循环变量是 ${details.variable}` : ''}？`,
            back: `这个 loop 由 ${details.source || 'for 语句里的表达式'} 控制。${lineText}`,
            status: 'new',
            tag: 'code-specific',
          },
        ]
      case 'import':
        return [
          {
            id: `specific-import-${item.lineNumber}`,
            front: '这个 import 让后面的代码可以使用什么？',
            back: `它让 ${formatList(details.imported) || details.module || '导入的模块'} 可以在后面使用。${lineText}`,
            status: 'new',
            tag: 'code-specific',
          },
        ]
      case 'call':
        return [
          {
            id: `specific-call-${item.lineNumber}`,
            front: `调用 ${details.name} 在这里做什么？`,
            back: `它会运行 ${details.name}${details.args?.length ? `，并传入 ${formatList(details.args)}` : ''}。${lineText}`,
            status: 'new',
            tag: 'code-specific',
          },
        ]
      case 'api':
        return [
          {
            id: `specific-api-${item.lineNumber}`,
            front: `第 ${item.lineNumber} 行发生了什么 API 或网络动作？`,
            back: `代码运行 ${details.expression || item.code.trim()}${details.name ? `，并把结果存到 ${details.name}` : ''}。`,
            status: 'new',
            tag: 'code-specific',
          },
        ]
      case 'data':
      case 'resource':
        return [
          {
            id: `specific-data-${item.lineNumber}`,
            front: `第 ${item.lineNumber} 行做了什么数据或资源处理？`,
            back: `代码运行 ${details.expression || item.code.trim()}${details.name ? `，并把结果命名为 ${details.name}` : ''}。`,
            status: 'new',
            tag: 'code-specific',
          },
        ]
      default:
        return []
    }
  }

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
