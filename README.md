# claude-setups-registry

Public registry and gallery for [claude-setups](https://github.com/adhenawer/claude-setups) — Claude Code setups shared by the community.

## Structure

- `data/setups/<author>/<slug>.json` — canonical descriptor per published setup
- `data/tag-aliases.yml` — canonicalization map for free-form tags
- `site/` — static gallery source (served via GitHub Pages)
- `.github/workflows/ingest.yml` — validates + commits on new submissions

## How to publish

Use the CLI: `npx -y claude-setups publish` (from the main project). The CLI creates a GitHub issue here labeled `setup:submission`; the ingest Action validates and commits.

## License

MIT

## Moderation

- `setup:submission` issues are processed by `.github/workflows/ingest.yml`
- `setup:revoke` issues are processed by `.github/workflows/moderate.yml`; author verification is mandatory (issue opener must match the setup author)
