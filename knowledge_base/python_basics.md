# Python Basics

Python programs are usually read from top to bottom. A beginner should trace each value as it is created, changed, checked, and returned or printed.

## Variables

A variable gives a value a name. In Python, assignment uses `=`:

```python
name = "Ada"
score = 10
```

Read this as "store the value on the right in the name on the left." A variable can be reassigned later, so learners should check the most recent assignment before assuming what it contains.

## Functions

A function packages reusable behavior:

```python
def greet(name):
    return "Hello, " + name
```

The name in parentheses is a parameter. The `return` statement sends a result back to the caller.

## Conditionals

An `if` statement chooses whether a block runs:

```python
if score >= 70:
    print("pass")
```

The indented lines belong to the condition. A learner should ask, "What value makes this condition true?"

## Loops

A `for` loop repeats work over a sequence:

```python
for item in items:
    print(item)
```

Track the loop variable because it changes on each pass.

## Reading Python Code in Context

When a learner highlights one Python line, first identify whether the line creates a value, checks a condition, repeats work, calls a function, or sends a result back. Then connect it to the previous and next meaningful lines. For example, a `return` line often depends on variables prepared earlier in the function.

## Parameters and Arguments

Parameters are names in a function definition. Arguments are the real values passed when the function is called:

```python
def add_tax(price):
    return price * 1.08

total = add_tax(20)
```

Here `price` is the parameter and `20` is the argument. Explain this distinction when students ask where a value comes from.

## Scope

Scope means where a name can be used. A variable created inside a function is usually local to that function. If a highlighted line uses a name, check whether it was defined inside the same function, passed as a parameter, imported, or defined globally.

## Truthy and Falsey Values

Python conditions do not always compare with `==`. Values such as empty strings, empty lists, `0`, and `None` behave as false in an `if` condition. Non-empty strings and lists usually behave as true.

## Debugging Strategy

For beginner debugging, ask:

- What value does each variable hold before this line?
- Does this line change a value or only read it?
- What line runs next?
- What would be printed if we inserted `print()` here?
