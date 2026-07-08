# Code Conventions

This project follows the TypeScript conventions from the referenced gist where they apply to this codebase. Angular-specific conventions are not used because this project is a static browser app, not an Angular application.

Reference:

- `https://gist.github.com/anichitiandreea/e1d466022d772ea22db56399a7af576b`

## Naming

- Use meaningful, pronounceable names.
- Avoid abbreviations unless they are standard in the domain, such as DBH or WCC.
- Use `camelCase` for variables, functions, methods, and parameters.
- Use `PascalCase` for TypeScript types and interfaces.
- Boolean names should be positive and start with `is`, `has`, `can`, or another clear predicate where practical.

## Formatting

- Use 2 spaces, not tabs.
- Use semicolons.
- Always use braces for control-flow blocks.
- Keep imports grouped and readable:
  - third-party imports
  - Node/runtime imports
  - local imports

Formatting is checked with Prettier:

```bash
npm run format:check
```

## Comments

- Prefer clear names and small functions over explanatory comments.
- Use comments only to explain why something exists or to clarify a complex algorithm.
- Avoid comments that repeat the code.

## Current Migration State

The test and build tooling are TypeScript/Node based. The browser calculator modules are still plain JavaScript loaded directly by `index.html`; they should be migrated incrementally rather than rewritten in one large change.
