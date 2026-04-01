# D&D Character Builder

A work-in-progress Dungeons & Dragons character builder focused on edition-aware rules, campaign-specific overrides, and structured class / subclass selection.

This project is currently in active development and undergoing a UI refactor toward a step-based modal flow.

## Overview

The goal of this project is to provide a flexible, data-driven character builder that:
- Supports multiple D&D editions (e.g. 1e, 2e, 5e)
- Applies campaign-specific rules (race/class adds & removals)
- Handles edition-specific class mechanics and structures
  - Including 2e class groupings
  - Subclass unlock levels
  - Multiclass level allocation
- Enforces rules progressively via a step-based flow
- Produces clean, structured character output suitable for prompts or downstream tools

The UI is currently transitioning from a single reactive form to a step-based modal wizard that better reflects the actual D&D character creation process.

## Tech Stack
### Frontend
- React
- TypeScript
- Vite

### Backend
- Node.js
- Express
- node-fetch
- dotenv

### Tooling
- ESLint
- Nodemon
- Concurrently

## Getting Started
### Install dependencies
```bash
npm i
```

### Run development servers
Runs frontend (Vite) and backend (Express) concurrently:
```bash
npm run dev
```

### Run frontend only
Runs frontend (Vite) and backend (Express) concurrently:
```bash
npm run dev:frontend
```

### Run backend only
Runs frontend (Vite) and backend (Express) concurrently:
```bash
npm run dev:backend
```

## Project Structure (High-Level)
```
/src
  /data        # Editions, settings, races, classes
  /helpers     # Option resolution, overrides, lookup helpers
  /components  # React components (Form, selects, etc.)
server/
  index.js     # Express server
```

## Current features

### Rules & Data
- Edition-based filtering for races, classes, and equipment
- Campaign-specific overrides:
  - Add/remove races
  - Add/remove classes
- Edition-aware class definitions
  - Subclass unlock levels
  - Multiclass support with level allocation
- Automatic defaulting when only one valid option exists

### Class Selection
- Primary and secondary class cards
- Expand/collapse editing per class
- Maximum of two classes enforced
- Level allocation per class with remaining-level validation
- Automatic cleanup of unused secondary classes
- Correct state restoration when navigating steps forward/back

### Step-Based Flow (In Progress)
- Step navigation with controlled state resets
- Step-specific validation
- Class step supports card-based editing instead of inline selects

### Equipment & Wealth
- Edition-aware starting wealth calculation (currently 5e)
- Wealth tracked and updated as equipment is selected
- Equipment cost parsing (gp / sp / cp)
- Equipment weight calculation
- Disables equipment selection when insufficient gold remains
- Currency math handled via normalized units to avoid float errors

## Known limitations
- Step-based UI refactor is still in progress
- No persistence (characters are not saved yet)
- No character export format finalized
- Equipment rules are simplified:
  - Starting equipment vs purchased equipment not fully separated
  - Class-granted equipment not yet modeled
- Encumbrance rules are not enforced (weight is tracked only)
- Validation is strict but not always user-friendly yet
- UI is currently optimized for power users rather than beginners

## Planned Work
### UI / UX
- Complete step-based modal wizard refactor
- Improve step transitions and validation messaging
- Add summary / review step
- Improve visual distinction between editable and locked steps

### Rules & Systems
- Finalize starting equipment vs purchased equipment logic
- Add class-granted equipment bundles
- Add encumbrance rules per edition
- Expand wealth handling for additional editions
- Add backgrounds and background-granted features

### State & Architecture
- Further centralize and normalize draft state
- Reduce effect-driven dependency chains
- Improve reset logic when upstream choices change

### Output & Persistence
- Character export (JSON + human-readable)
- Optional local persistence
- Campaign-specific export formatting
