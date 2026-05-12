# VCode Tutor

VCode Tutor is an educational coding assistant that explains code in clear, beginner-friendly language. The project is designed to help non-coding background students & vibe coders to understand what each line of code does, and learn how different parts of the code work together.

The goal is to make code explanations more useful for learning, reviewing, and studying.


## Key Features

- Paste or upload code for explanation
- Split-screen learning interface
- Code shown on one side and explanation shown on the other
- Chunk-by-chunk explanations based on functionality
- Optional line-by-line support when needed
- Beginner, intermediate, and advanced explanation modes
- Explanation of packages, modules, keywords, and syntax
- Highlighted technical terms such as `import`, `with`, `args`, and common libraries
- A local RAG-style flow assistant
- Flashcard generation for review


## Design Goals

The main design goal was to make code explanations feel clear, organized, and actually useful for studying.

Example questions:
- What the code is trying to accomplish
- What each functional block does
- Why specific packages or methods are used
- How syntax and structure work together
- Which terms are important to remember

## My Role

I worked on the product concept, UX direction, feature planning, interface design, frontend implementation, and iteration strategy.

My responsibilities included:

- Identifying the learning problem
- Defining the target user experience
- Designing interface
- Planning explanation levels for different learning needs
- Improving the explanation structure from line-by-line to chunk-based
- Creating feature requirements for flashcards, RAG based assistant, and study tools
- Testing the clarity of generated explanations


## UX Research / Product Thinking

This project was inspired by my experience as a non tech background student. I really need help understanding the logic behind the code in a way that they can revisit later.

VCode Tutor explores questions such as:

- How can AI-generated explanations better support learning?
- How can code be explained by function instead of only by line?
- How can technical terms be introduced without overwhelming beginners?
- How can explanations become reusable study materials?
- How can a code learning tool support different levels of prior knowledge?

## Example Use Case

A student pastes Python code that uses packages such as `requests`, `json`, `os`, or `numpy`.

Instead of only explaining the output, VCode Tutor can explain:

- What each package is used for
- What the main code blocks are doing
- What important syntax means
- How data flows through the code
- Which concepts the student should remember
- How to turn the explanation into flashcards


## Future Improvements

Planned improvements include:

- More accurate explanations for different programming languages
- Better detection of packages, functions, and syntax
- More customizable explanation depth
- Improved flashcard generation
- Chroma vector RAG upgrade.
- Quizzes based on the uploaded code
- Support for more programming language


## Live Demo

[vcodetutor.vercel.app]


