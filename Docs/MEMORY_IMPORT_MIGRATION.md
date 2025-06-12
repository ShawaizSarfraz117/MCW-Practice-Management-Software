# CLAUDE.md Memory Import Migration

This document describes the migration of CLAUDE.md to use Claude Code's memory import feature for better documentation organization.

## Overview

The CLAUDE.md file has been refactored to use the `@path/to/import` syntax, which allows Claude Code to import documentation from multiple files. This creates a more modular and maintainable documentation structure.

## What Changed

### Before

- Single large CLAUDE.md file (600+ lines)
- All documentation inline in one file
- Difficult to navigate and maintain
- No support for personal developer preferences

### After

- Concise CLAUDE.md file (~72 lines) with memory imports
- Documentation split into logical sections
- Each topic in its own file under `Docs/`
- Support for personal preferences via `@~/.claude/mcw-preferences.md`

## New File Structure

```
Docs/
├── architecture.md           # Monorepo structure, tech stack, patterns
├── api-patterns.md          # API development patterns
├── code-quality-conventions.md  # Code quality and conventions
├── development-commands.md   # Development and setup commands
├── environment-setup.md     # Environment configuration
├── error-handling.md        # Error handling guidelines
├── testing-guidelines.md    # Testing strategy and patterns
├── verification-commands.md # Fast verification commands
└── MEMORY_IMPORT_MIGRATION.md  # This file
```

## How Memory Imports Work

1. **Syntax**: Use `@path/to/file` to import content
2. **Paths**: Both relative and absolute paths are supported
3. **Recursion**: Imports can be nested up to 5 levels deep
4. **Home directory**: `@~/` refers to user's home directory

### Examples from CLAUDE.md:

```markdown
## Architecture and Development

- @Docs/architecture.md
- @Docs/api-patterns.md

## Individual Developer Preferences

- @~/.claude/mcw-preferences.md
```

## Benefits

1. **Modularity**: Each topic has its own file
2. **Maintainability**: Easier to update specific sections
3. **Navigation**: Quick access to relevant documentation
4. **Personalization**: Developers can add individual preferences
5. **Version Control**: Better diff visibility for documentation changes
6. **No Repository Pollution**: Personal preferences stay out of the repo

## Usage

### For Claude Code

Claude Code automatically reads and processes these imports when loading CLAUDE.md. You can verify what's loaded by running the `/memory` command.

### For Developers

1. Edit specific documentation files in `Docs/` instead of CLAUDE.md
2. Add personal preferences to `~/.claude/mcw-preferences.md`
3. Use `@` imports when referencing other documentation

### Adding New Documentation

1. Create a new file in `Docs/`
2. Add an import in CLAUDE.md under the appropriate section
3. Follow the existing naming conventions

## Migration Details

The following content was extracted from CLAUDE.md into separate files:

- **Architecture** → `architecture.md`
- **API patterns** → `api-patterns.md`
- **Development commands** → `development-commands.md`
- **Environment setup** → `environment-setup.md`
- **Error handling** → `error-handling.md`
- **Testing guidelines** → `testing-guidelines.md`
- **Code quality** → `code-quality-conventions.md`
- **Verification commands** → `verification-commands.md`

Critical instructions and project overview remain in CLAUDE.md as they should always be immediately visible.
