import assert from 'node:assert/strict'
import {
  createFlashcards,
  createStudyNotes,
  detectCodingLanguage,
  summarizeCode,
  translateCode,
} from '../src/services/mockTranslator.js'

function conceptsFor(code, codingLanguage = 'javascript') {
  return translateCode({
    code,
    codingLanguage,
    explanationLanguage: 'english',
    explanationLevel: 'beginner',
  }).map((line) => line.concept)
}

function explain(code, codingLanguage = 'javascript') {
  return translateCode({
    code,
    codingLanguage,
    explanationLanguage: 'english',
    explanationLevel: 'intermediate',
  })
}

const javascriptCode = `function greet(name) {
  const message = "Hi " + name
  if (name) {
    return message
  }
}`

assert.deepEqual(conceptsFor(javascriptCode), [
  'function',
  'const',
  'if',
  'return',
  'structure',
  'structure',
])

const ifConcept = conceptsFor('if (ready) {\n  return true\n}')
assert.equal(ifConcept[0], 'if')
assert.notEqual(ifConcept[0], 'function')

assert.deepEqual(conceptsFor('# explain the value\nname = "Ada"\nprint(name)', 'python'), [
  'comment',
  'let',
  'print',
])

assert.deepEqual(
  conceptsFor(
    `public class Main {
  public static void main(String[] args) {
    System.out.println("Hi");
  }
}`,
    'java',
  ),
  ['class', 'function', 'print', 'structure', 'structure'],
)

assert.deepEqual(
  conceptsFor(
    `#include <iostream>
for (int i = 0; i < 3; i++) {
  cout << i;
}`,
    'cpp',
  ),
  ['import', 'for', 'print', 'structure'],
)

const emptyExplanations = explain('')
assert.equal(emptyExplanations.length, 1)
assert.equal(emptyExplanations[0].concept, 'blank')

const jsExplanations = explain(javascriptCode)
const cards = createFlashcards(jsExplanations)
assert.ok(cards.some((card) => card.tag === 'function'))
assert.ok(cards.some((card) => card.tag === 'if'))
assert.ok(cards.some((card) => card.tag === 'code-specific' && card.front.includes('message')))
assert.ok(cards.every((card) => !('lineNumber' in card)))
assert.ok(jsExplanations[1].explanation.includes('message'))
assert.ok(jsExplanations[1].explanation.includes('"Hi " + name'))

const reactCode = `import React, { useState } from 'react'
const [userName, setUserName] = useState("Ada")
const handleClick = () => setUserName("Grace")`
const reactExplanations = explain(reactCode)
assert.equal(reactExplanations[0].concept, 'import')
assert.equal(reactExplanations[1].concept, 'state')
assert.equal(reactExplanations[2].concept, 'function')
assert.ok(reactExplanations[0].explanation.includes('useState'))
assert.ok(reactExplanations[1].explanation.includes('userName'))
assert.ok(createFlashcards(reactExplanations).some((card) => card.front.includes('userName')))
assert.equal(detectCodingLanguage(reactCode), 'javascript')

const pythonApiCode = `import requests, json, os
api_url = "https://example.com/data"
response = requests.get(api_url)
data = response.json()
with open("data.json", "w") as file:
    json.dump(data, file)`
const pythonApiExplanations = explain(pythonApiCode, 'python')
const pythonNotes = createStudyNotes({
  code: pythonApiCode,
  codingLanguage: 'python',
  explanations: pythonApiExplanations,
  explanationLevel: 'beginner',
})
assert.equal(detectCodingLanguage(pythonApiCode), 'python')
assert.ok(pythonNotes.summary.includes('Python'))
assert.ok(pythonNotes.chunks.some((chunk) => chunk.title === 'API Request'))
assert.ok(pythonNotes.chunks.some((chunk) => chunk.title === 'Data Loading / Parsing'))
assert.ok(pythonNotes.glossary.some((item) => item.term === 'requests'))
assert.ok(createFlashcards(pythonApiExplanations).some((card) => card.front.includes('api_url')))

assert.equal(detectCodingLanguage('public class Main { public static void main(String[] args) {} }'), 'java')
assert.equal(detectCodingLanguage('#include <iostream>\nint main() { std::cout << "Hi"; }'), 'cpp')

const summary = summarizeCode({
  code: javascriptCode,
  codingLanguage: 'javascript',
  explanations: jsExplanations,
})

assert.match(summary.overview, /function/)
assert.ok(summary.bullets.some((bullet) => bullet.includes('Main concepts used')))

console.log('mockTranslator tests passed')
