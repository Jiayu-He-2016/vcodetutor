export const codingLanguages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
]

export const explanationLanguages = [
  { value: 'english', label: 'English' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'spanish', label: 'Spanish' },
]

export const explanationLevels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export const sampleCode = `function greetStudent(name) {
  const message = "Keep going, " + name;

  if (name) {
    return message;
  }

  return "Keep going, coder";
}`

export const keywordDefinitions = {
  const: 'Creates a variable whose binding cannot be reassigned.',
  let: 'Creates a block-scoped variable that can be reassigned.',
  function: 'Defines a reusable block of code.',
  for: 'Repeats code while a condition or sequence continues.',
  if: 'Runs code only when a condition is true.',
  return: 'Sends a value back from a function.',
  class: 'Defines a blueprint for creating objects.',
  def: 'Defines a Python function.',
  public: 'Allows other code to access this class member.',
  import: 'Brings code from another module into this file.',
}
