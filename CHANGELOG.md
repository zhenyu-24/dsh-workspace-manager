# Changelog

## 1.2.0 — 2026-10-25

- Split Host/Client source, tests, docs and release scripts into focused directories.
- Ship built dist exports in verified release archives; keep generated output out of source control.
- Add manifest/loader/export verification, archive allowlist checks and SHA-256 checksums.
- Add catalog baseline cleanup and child-session filtering regression coverage.
- Add Windows/Linux CI and tag-based GitHub Release automation.
- Document migration, installation, development, data boundaries and validation limits.
- Preserve feature behavior, plugin row ID and storage domain from 1.1.5.

## 1.1.5 — 2026-10-25

First public release, derived from the local workspace enhancer 1.1.5.

- Independent workspace/session tree management panel.
- Search, header sorting, multi-selection, rename and archive actions.
- Workspace source-folder editor with native directory picker.
- Explicit workspace-removal and source-folder permission boundaries.
- Shell-free native file manager opening with Explorer handoff handling.
- Source-folder persistence, batch-operation and file-opener tests.
- Published as @zhenyu-24/dsh-workspace-manager under the MIT license.
