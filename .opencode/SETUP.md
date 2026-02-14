# OpenCode Setup Guide

## Commands Location

Custom commands are defined in `.opencode/commands/` directory as markdown files.

### Available Commands

After setup, you can use these commands in the OpenCode TUI:

- `/publish-wp [MAJOR|MINOR|PATCH|AUTO]` - Publish WordPress plugin
- `/build-deploy` - Build SDK and deploy to test environments

## Verification

To verify commands are loaded:

1. Open OpenCode in the terminal:
   ```bash
   cd /Users/rogerpugaruiz/Proyectos/guiders-sdk
   opencode
   ```

2. Type `/` to see available commands

3. Your custom commands should appear in the list

## Troubleshooting

### Commands not appearing

If commands don't appear:

1. **Check frontmatter syntax**:
   ```yaml
   ---
   description: Your description here
   agent: build
   ---
   ```

2. **Verify file location**:
   ```
   .opencode/
   └── commands/
       ├── publish-wp.md
       └── build-deploy.md
   ```

3. **Restart OpenCode**:
   Exit and reopen OpenCode to reload commands

4. **Check OpenCode version**:
   ```bash
   opencode --version
   ```
   Make sure you're using a recent version that supports custom commands.

### Command errors

If a command runs but fails:

1. Check the command output for specific errors
2. Verify all required tools are installed (git, npm, etc.)
3. Review the command markdown file for syntax issues

## Alternative: JSON Configuration

You can also define commands in `opencode.json` at the project root:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "command": {
    "build-deploy": {
      "template": "Build the SDK using npm run build, then copy dist/index.js to wordpress-plugin/guiders-wp-plugin/assets/js/guiders-sdk.js and demo/app/guiders-sdk.js",
      "description": "Build and deploy SDK",
      "agent": "build"
    }
  }
}
```

However, markdown files in `.opencode/commands/` are preferred for:
- Better organization
- Easier editing
- More detailed instructions
- Version control friendly

## Command Development Workflow

1. Create new command file in `.opencode/commands/`
2. Test it with simple instructions first
3. Iterate and add more details
4. Use `$ARGUMENTS` for user input
5. Use `!`command`` for shell output injection
6. Use `@filename` for file references

Example minimal command:

```markdown
---
description: Run tests
agent: build
---

Run all tests with coverage:
!`npm test`

Analyze the results and suggest improvements.
```
