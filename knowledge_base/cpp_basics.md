# C++ Basics

C++ uses explicit types, headers, and block structure. Beginners should watch types, scopes, and where values enter or leave a function.

## Includes

`#include <iostream>` brings in standard input and output tools. Explain includes as setup that makes later names available.

## Main Function

Many C++ programs start at `int main()`:

```cpp
int main() {
  return 0;
}
```

`return 0` usually means the program finished successfully.

## Variables and Types

C++ variables usually include a type:

```cpp
int count = 3;
string name = "Ada";
```

Explain the type, the variable name, and the starting value.

## Loops and Output

`for` loops repeat work. `cout` prints output:

```cpp
for (int i = 0; i < 3; i++) {
  cout << i;
}
```

Track the initializer, condition, update step, and loop body.

## Reading C++ Code in Context

When a learner highlights C++ code, identify the type, name, scope, and side effect. C++ often makes data types visible, so explain what kind of value a variable can hold before explaining how it is used.

## Functions and Parameters

C++ functions declare a return type and parameter types:

```cpp
int add(int a, int b) {
  return a + b;
}
```

`int add` means the function returns an integer. `int a` and `int b` are integer inputs. The `return` expression must match the expected return type.

## References and Copies

C++ can pass values by copy or by reference:

```cpp
void update(int& value) {
  value = value + 1;
}
```

The `&` means the function can modify the original value. This is important when explaining whether highlighted code changes something outside the current function.

## Vectors and Indexing

`vector` stores a resizable list. Indexing starts at `0`, so `items[0]` is the first item. Off-by-one errors often happen when loops use `<=` instead of `<`.

## Common C++ Mistakes

Watch for missing semicolons, type mismatches, using a variable before it is initialized, and reading past the end of an array or vector.
