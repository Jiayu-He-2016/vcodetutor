import { useEffect, useRef } from 'react'

const followUpCards = {
  english: [
    { label: 'Why use this here?', prompt: 'Why use this here?' },
    { label: 'Explain key terms', prompt: 'Explain key terms' },
    { label: 'Common mistake', prompt: 'Common mistake' },
    { label: 'Give me a practice question', prompt: 'Give me a practice question' },
    { label: 'Explain step by step', prompt: 'Explain step by step' },
  ],
  chinese: [
    { label: '为什么这里要这样写？', prompt: '为什么这里要这样写？' },
    { label: '解释关键术语', prompt: '解释关键术语' },
    { label: '常见错误', prompt: '常见错误' },
    { label: '给我一个练习题', prompt: '给我一个练习题' },
    { label: '一步一步解释', prompt: '一步一步解释' },
  ],
}

function latestDebugResult(messages) {
  return [...messages].reverse().find((message) => message.result)?.result
}

export default function AssistantPanel({
  mode,
  explanationLanguage,
  status,
  error,
  messages,
  onFollowUp,
}) {
  const isLoading = status === 'loading'
  const chatScrollRef = useRef(null)
  const cards = followUpCards[explanationLanguage] ?? followUpCards.english
  const debugResult = import.meta.env.VITE_ASSISTANT_DEBUG === 'true' ? latestDebugResult(messages) : null

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, status])

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 bg-stone-50 px-4 py-4 text-left">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-normal text-stone-950">Ask Assistant</h2>
            <span className="rounded-full border border-teal-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-teal-800">
              {mode}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {explanationLanguage === 'chinese' ? '用初学者友好的方式解释高亮代码' : 'Your code tutor for highlighted code'}
          </p>
        </div>
      </div>

      <div ref={chatScrollRef} className="assistant-chat-scroll max-h-[620px] space-y-4 overflow-y-auto p-4">
        {error && (
          <div className="max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm font-medium leading-6 text-amber-900">
            {error}
          </div>
        )}

        {!messages.length && !error && (
          <div className="flex items-start gap-3 text-left">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
              VT
            </div>
            <div className="max-w-3xl rounded-2xl rounded-tl-sm border border-teal-100 bg-teal-50 p-4">
              <p className="text-sm leading-6 text-stone-800">
                {explanationLanguage === 'chinese'
                  ? '高亮一小段代码后提问。我会先用简短的话解释它在这个程序里做什么。'
                  : 'Highlight a small piece of code, then ask. I’ll start with a short explanation of what it does in this program.'}
              </p>
            </div>
          </div>
        )}

        {messages.map((message) =>
          message.role === 'code' ? (
            <div key={message.id} className="flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200" />
              <article className="max-w-3xl rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Now asking about {message.label}
                </p>
                <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap rounded-xl bg-stone-950 p-3 text-xs leading-5 text-stone-50">
                  {message.code}
                </pre>
              </article>
              <div className="h-px flex-1 bg-stone-200" />
            </div>
          ) : message.role === 'user' ? (
            <div key={message.id} className="flex justify-end text-left">
              <article className="max-w-2xl rounded-2xl rounded-tr-sm border border-stone-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
                  {explanationLanguage === 'chinese' ? '你问了' : 'You asked'}
                </p>
                <p className="mt-1 text-sm leading-6 text-stone-800">{message.text}</p>
              </article>
            </div>
          ) : (
            <div key={message.id} className="flex items-start gap-3 text-left">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
                VT
              </div>
              <article className="max-w-3xl rounded-2xl rounded-tl-sm border border-teal-100 bg-teal-50 p-4 shadow-sm">
                <p className="text-sm leading-6 text-stone-900">{message.text}</p>
              </article>
            </div>
          ),
        )}

        {isLoading && (
          <div className="flex items-start gap-3 text-left">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
              VT
            </div>
            <div className="max-w-3xl rounded-2xl rounded-tl-sm border border-teal-100 bg-teal-50 p-4 text-sm text-stone-600">
              {explanationLanguage === 'chinese' ? '正在阅读你高亮的代码...' : 'Reading your highlighted code...'}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="border-t border-stone-100 pt-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
              {explanationLanguage === 'chinese' ? '继续追问' : 'Ask a follow-up'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cards.map((card) => (
                <button
                  key={card.prompt}
                  type="button"
                  onClick={() => onFollowUp(card.prompt)}
                  disabled={isLoading}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
                >
                  {card.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {debugResult && (
          <details className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-left">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
              Developer RAG details
            </summary>
            <div className="mt-3 space-y-3">
              {debugResult.sources?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-stone-600">Sources</p>
                  <ul className="mt-1 space-y-1 text-xs leading-5 text-stone-600">
                    {debugResult.sources.map((source) => (
                      <li key={source.id}>
                        {source.source} - {source.title} ({source.score})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {debugResult.pipeline?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-stone-600">Pipeline</p>
                  <p className="mt-1 text-xs leading-5 text-stone-600">
                    {debugResult.pipeline.join(' -> ')}
                  </p>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </section>
  )
}
