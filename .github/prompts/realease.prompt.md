---
mode: agent
tools: ['edit', 'runNotebooks', 'search', 'new', 'runCommands', 'runTasks', 'usages', 'vscodeAPI', 'think', 'problems', 'changes', 'testFailure', 'openSimpleBrowser', 'fetch', 'githubRepo', 'extensions', 'todos', 'runTests', 'Nx Mcp Server', 'context7', 'playwright', 'copilotCodingAgent', 'activePullRequest', 'openPullRequest', 'getPythonEnvironmentInfo', 'getPythonExecutableCommand', 'installPythonPackage', 'configurePythonEnvironment']
---
## Instructions Deploy versión estable (release final)
1. Revisa CHANGELOG_TEMP.md: Lee el archivo `CHANGELOG_TEMP.md` para obtener información sobre los cambios pendientes de documentar (este archivo tiene información sobre la nueva versión y los cambios realizados).
	- Si el archivo está vació usa el contexto de la conversación para determinar los cambios realizados y la versión a liberar.
	- Si no sabes cuál es la versión a liberar, pregunta antes de continuar.
2. Modifica los archivos del plugin:
	 - `wordpress-plugin/guiders-wp-plugin/guiders-wp-plugin.php` → Actualiza `Version: X.Y.Z`
	 - `wordpress-plugin/guiders-wp-plugin/readme.txt` → Actualiza `Stable tag: X.Y.Z` y mueve/ajusta bloque changelog (crear entrada final basada en la última rc, consolidando fixes, y usando contenido de CHANGELOG_TEMP.md si existe).
3. Limpia CHANGELOG_TEMP.md: Si se usó información, deja el archivo vacío pero con la estructura básica intacta.
4. Checklist final (exhaustiva):
	 - `npm run build`
	 - `npx tsc --noEmit --strict`
	 - `npm test` y (opcional) cobertura mínima
	 - `npx eslint src/**/*.ts`
	 - `npm audit` (sin vulnerabilidades altas/críticas)
5. Ejecutar: `bash wordpress-plugin/release-wp-publish.sh "chore(wp-plugin): release X.Y.Z"`
6. Verificar que el tag `vX.Y.Z` se creó y CI pasó.

## Idioma: Español