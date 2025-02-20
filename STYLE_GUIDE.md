# Cloud People Style Guide

## Import Rules

### 1. Import Statement Organization

Each import should be on its own line, even when importing from the same package:

```typescript
// ✅ Correct
import { useCallback } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';

// ❌ Incorrect
import { useCallback, useState, useEffect } from 'react';
```

### 2. Import Order

Imports should be organized in the following order, with a blank line between each group:

1. React imports
2. External package imports
3. Internal module imports (starting with @/)
4. Relative imports

Example:
```typescript
import { useCallback } from 'react';
import { useState } from 'react';

import { z } from 'zod';
import { motion } from 'framer-motion';

import { useStore } from '@stores/store';
import { type Config } from '@types';

import { MyComponent } from './my-component';
import { utils } from '../utils';
```

### 3. Type Imports

When importing types, use the `type` keyword:

```typescript
// ✅ Correct
import type { MyType } from './types';

// ❌ Incorrect
import { type MyType } from './types';
```

## Code Organization

### 1. Component Structure

- One component per file
- Component name should match file name
- Props interface should be named `[Component]Props`
- Styles should be in a separate `.css` file

### 2. File Naming

- React components: PascalCase (e.g., `MyComponent.tsx`)
- Utilities and other files: kebab-case (e.g., `my-utils.ts`)
- Test files: Same name as the file they test with `.test` or `.spec` suffix

### 3. Code Formatting

- Use 2 spaces for indentation
- Maximum line length: 100 characters
- Use single quotes for strings
- No trailing commas in function parameters
- Trailing commas in objects and arrays

## Best Practices

### 1. TypeScript

- Prefer `type` over `interface` for public APIs
- Use explicit return types for functions
- Avoid using `any`
- Use `unknown` instead of `any` when type is truly unknown

### 2. React

- Use functional components
- Prefer controlled components
- Use proper cleanup in useEffect
- Memoize callbacks and complex computations

### 3. State Management

- Keep state as local as possible
- Use appropriate state management tools for different scopes
- Document state shape and interactions

## Automated Enforcement

This style guide is enforced through:

1. ESLint rules in `packages/eslint-config/index.js`
2. Prettier configuration in `packages/eslint-config/.prettierrc.json`
3. TypeScript configuration in `packages/tsconfig/base.json`

To check your code against these rules:
```bash
pnpm lint
pnpm format
```
