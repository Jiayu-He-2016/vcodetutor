# JavaScript Basics

JavaScript programs often define values and functions, then react to user actions or data.

## Variables

Use `const` when a binding should not be reassigned. Use `let` when the variable will change:

```javascript
const name = "Ada"
let count = 0
```

For beginners, explain the right-hand side first, then the name receiving that value.

## Functions

Functions package reusable behavior:

```javascript
function greet(name) {
  return "Hello, " + name
}
```

Arrow functions are also functions:

```javascript
const greet = (name) => "Hello, " + name
```

Explain parameters as inputs and `return` as the output.

## Conditionals

`if` statements choose a branch:

```javascript
if (name) {
  return message
}
```

The code inside braces runs only if the condition is truthy.

## React State

React state stores values that can change and cause the UI to update:

```javascript
const [name, setName] = useState("")
```

Explain the state value, the setter function, and what user action might update it.

## Reading JavaScript Code in Context

When a learner highlights JavaScript, identify the action: create a value, call a function, check a condition, update state, return JSX, or handle an event. Then explain how that action affects the next line or the user interface.

## Objects and Properties

Objects group related values:

```javascript
const user = { name: "Ada", score: 10 }
console.log(user.name)
```

`user.name` reads the `name` property from the `user` object. If a highlighted line uses dot notation, explain which object is being accessed and which property is being read or changed.

## Arrays and Mapping

Arrays hold ordered lists. Methods like `map`, `filter`, and `reduce` create new values from arrays:

```javascript
const names = users.map((user) => user.name)
```

Explain the item variable, what each pass returns, and what the final array contains.

## Events

In frontend code, event handlers run after a user action:

```javascript
button.addEventListener("click", handleClick)
```

In React, `onClick={handleClick}` means the function runs when the user clicks. Connect highlighted handlers to the user action that triggers them.

## Async and Fetch

`async`, `await`, and `fetch` often appear together:

```javascript
const response = await fetch(url)
const data = await response.json()
```

Explain that the program waits for a network response, then parses the returned JSON. Mention possible loading and error states when relevant.
