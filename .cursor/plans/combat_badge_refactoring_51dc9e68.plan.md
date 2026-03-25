---
name: Combat Badge Refactoring
overview: Refactor the combat badge pipeline to use priority-driven composition, eliminate immunity duplication at the source, add shared turn-duration formatting, enforce a max-4 + overflow cap on CombatantPreviewCard, and update reference docs.
todos: []
isProject: false
---

# Combat Badge Refactoring

## Problem Summary

The `CombatantPreviewCard` badge row is clut