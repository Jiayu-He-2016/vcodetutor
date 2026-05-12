# Common Programming Errors

Beginner explanations should normalize errors as clues. Connect each error to the line or concept that likely caused it.

## Name or Reference Errors

A name error usually means the code uses a variable before it has been defined, or there is a spelling/capitalization mismatch.

## Type Errors

A type error usually means a value is being used in a way that does not match its type. Examples include adding a number to a string without converting, calling something that is not a function, or reading a property that does not exist.

## Syntax Errors

Syntax errors mean the language parser cannot understand the code. Common causes include missing parentheses, braces, colons, commas, or quotes.

## Off-by-One Errors

Loops and indexes can accidentally run one time too many or too few. Ask what the first value is, what the last value should be, and when the loop stops.

## Async and API Errors

Network or async code can fail because the request is slow, rejected, malformed, or returns unexpected data. Explain where the request starts, where it is awaited, and how errors are handled.

## Undefined or Null Values

JavaScript may produce errors when code reads a property from `undefined` or `null`. Explain which value was expected to be an object and where it should have been created.

## Indentation and Block Errors

Python uses indentation to decide which lines belong to a function, loop, or condition. JavaScript, Java, and C++ use braces. When a highlighted line appears inside a block, explain what starts and ends that block.

## Return Too Early

A `return` statement exits the current function. A common mistake is placing `return` inside a loop or condition when the programmer expected later lines to run.

## Mutating Shared State

Some bugs happen when code changes an array, object, or state value that other code also depends on. In React, prefer state setters and immutable updates so the UI can detect changes.

## Debugging with Small Examples

When code is confusing, reduce it to a tiny input and trace one pass. For loops, trace the first item and last item. For conditionals, test one true case and one false case.
