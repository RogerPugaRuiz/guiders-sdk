---
description: Show project status
agent: plan
---

# Show Project Status

Show a comprehensive overview of the current project status.

## Git Status

Current git status:
!`git status --short`

## Recent Commits

Last 5 commits:
!`git log --oneline -5`

## Branch Info

Current branch:
!`git branch --show-current`

## SDK Build Status

Check if SDK is built:
!`ls -lh dist/index.js 2>/dev/null || echo "SDK not built"`

## Development Servers

Check if development servers are running:
!`lsof -i :8081 -i :8090 -t 2>/dev/null && echo "Dev servers running" || echo "Dev servers not running"`

## Summary

Based on the above information, provide a brief summary of:
- Current working branch
- Uncommitted changes (if any)
- Whether SDK needs rebuilding
- Whether dev servers are running
- Any recommendations for next steps
