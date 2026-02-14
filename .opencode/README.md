# OpenCode Commands for Guiders SDK

This directory contains custom slash commands for OpenCode to automate common workflows in the Guiders SDK project.

## Available Commands

### `/publish-wp [version-type]`

Publishes a new version of the WordPress plugin to GitHub.

**Usage:**
```
/publish-wp                    # Auto-detect version type from commits
/publish-wp MINOR             # Force MINOR version bump
/publish-wp MAJOR             # Force MAJOR version bump
/publish-wp PATCH             # Force PATCH version bump
/publish-wp AUTO              # Same as no argument (auto-detect)
```

**What it does:**
1. Analyzes commits since last release
2. Determines appropriate version bump (MAJOR/MINOR/PATCH)
3. Generates changelog in Spanish
4. Updates plugin version files
5. Creates git tag and pushes to GitHub
6. Generates ZIP file for distribution

**Files modified:**
- `wordpress-plugin/guiders-wp-plugin/guiders-wp-plugin.php`
- `wordpress-plugin/guiders-wp-plugin/readme.txt`

---

### `/build-deploy`

Builds the SDK and deploys it to all test environments.

**Usage:**
```
/build-deploy
```

**What it does:**
1. Runs `npm run build`
2. Copies SDK to WordPress plugin assets
3. Copies SDK to demo app
4. Verifies all files updated successfully

## How OpenCode Commands Work

OpenCode reads markdown files from `.opencode/commands/` directory. Each command file should:

1. **Have a frontmatter section** with metadata:
   ```yaml
   ---
   description: Brief description of what the command does
   agent: build  # Optional: specify which agent to use
   model: anthropic/claude-3-5-sonnet-20241022  # Optional: override model
   subtask: true  # Optional: force subagent invocation
   ---
   ```

2. **Use special placeholders** in the content:
   - `$ARGUMENTS` - All arguments passed to the command
   - `$1`, `$2`, `$3`, etc. - Individual positional arguments
   - `!`command`` - Inject shell command output
   - `@filename` - Include file content

3. **Conventional naming**: `command-name.md` becomes `/command-name`

## Creating New Commands

Example command structure:

```markdown
---
description: Create a new component
agent: build
---

# Create Component

Create a new React component named $ARGUMENTS with TypeScript support.

Current project structure:
!`ls -la src/components`

Use this style guide as reference:
@src/STYLE_GUIDE.md
```

## Command Options

| Option | Type | Description |
|--------|------|-------------|
| `description` | string | Brief description shown in TUI |
| `agent` | string | Agent to use (e.g., `build`, `plan`) |
| `model` | string | Override default model |
| `subtask` | boolean | Force subagent invocation |

## Tips

1. **Use `agent: build`** for commands that make file changes
2. **Use `$ARGUMENTS`** to accept user input
3. **Use `!`command``** to inject git log, file lists, etc.
4. **Use `@file`** to reference configuration or style guides
5. **Keep descriptions under 50 characters** for better TUI display
