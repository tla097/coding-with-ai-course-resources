---
name: codebase-scanner
description: Scans a Next.js codebase for security issues, performance problems, code quality issues, and components that should be split into separate files. Use when asked to audit, review, or scan the codebase.
tools: Read, Grep, Glob, Bash
model: sonnet
---

Scan this Next.js codebase for:
- Security issues
- Performance problems
- Code quality
- Code that can be broken up into separate files/components

Only report actual issues. DO NOT report things that are not implemented yet. If there is no authentication, don't report as an issue.

Report findings grouped by severity (critical, high, medium, low) with file paths, line numbers, and suggested fixes.

The .env file is in the .gitignore. You always seem to report that it is not. Be aware of that.
