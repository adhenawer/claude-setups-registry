<p align="center">
  <strong>claude-setups-registry</strong>
</p>

<p align="center">
  Community gallery for Claude Code setups — browse, compare, and mirror real configurations.
</p>

<p align="center">
  <a href="https://adhenawer.github.io/claude-setups-registry/"><img src="https://img.shields.io/badge/gallery-live-blueviolet" alt="Gallery"></a>
  <a href="https://github.com/adhenawer/claude-setups-registry/actions"><img src="https://github.com/adhenawer/claude-setups-registry/actions/workflows/ingest.yml/badge.svg" alt="Ingest"></a>
  <a href="https://github.com/adhenawer/claude-setups-registry/blob/master/LICENSE"><img src="https://img.shields.io/github/license/adhenawer/claude-setups-registry" alt="License"></a>
  <a href="https://github.com/adhenawer/claude-setups"><img src="https://img.shields.io/badge/CLI-claude--setups-blue" alt="CLI"></a>
</p>

---

This is the public registry behind [claude-setups](https://github.com/adhenawer/claude-setups). It stores published setup descriptors, optional bundles (hooks, skills, commands), and serves the browsable gallery via GitHub Pages. No server, no database — just static files and GitHub Actions.

## Gallery

**[Browse setups →](https://adhenawer.github.io/claude-setups-registry/)**

Each setup page shows: plugins, MCP servers, marketplaces, bundle file list with SHA-256 checksums, and a one-liner to mirror it.

## How It Works

```
Publisher                          Registry                         Consumer
────────                          ────────                         ────────
npx claude-setups publish    →    GitHub Issue (setup:submission)
                                       │
                                  ingest.yml validates + commits
                                       │
                                  data/setups/<author>/<slug>.json
                                  data/bundles/<author>/<slug>.tar.gz
                                       │
                                  pages.yml builds static site
                                       │
                                  gallery + JSON API              →    npx claude-setups mirror
```

1. **Publish** creates a GitHub Issue with the descriptor JSON + optional bundle tarball on a temp branch
2. **Ingest Action** validates the descriptor (schema, specialties, bundle path safety), commits to `data/`, deletes the temp branch
3. **Pages Action** rebuilds the static gallery from all `data/setups/` JSON files
4. **Mirror** fetches the descriptor + bundle directly from the Pages site

## Repository Structure

```
├── data/
│   ├── setups/<author>/<slug>.json    # Setup descriptors
│   ├── bundles/<author>/<slug>.tar.gz # Optional bundles
│   ├── specialties.yml                # Specialty taxonomy
│   └── tag-aliases.yml                # Tag canonicalization
├── site/
│   ├── index.html                     # Gallery template
│   ├── setup.html                     # Detail page template
│   ├── build.mjs                      # Static site generator
│   └── styles.css                     # Gallery styles
├── scripts/
│   ├── ingest.mjs                     # Issue → data/ pipeline
│   ├── validate-descriptor.mjs        # Schema + security validation
│   ├── revoke.mjs                     # Revocation handler
│   └── tests/                         # 23 tests
└── .github/workflows/
    ├── ingest.yml                     # On issue open → validate + commit
    ├── moderate.yml                   # On revoke issue → remove setup
    └── pages.yml                      # Deploy gallery to GitHub Pages
```

## Specialties

Setups are tagged with 1–3 specialties for filtering:

| Specialty | Description |
|---|---|
| `backend` | Backend engineer |
| `frontend` | Frontend engineer |
| `fullstack` | Full-stack engineer |
| `devops` | DevOps / SRE / Platform |
| `data-science` | Data science / ML engineer |
| `mobile` | Mobile (iOS / Android / React Native) |
| `security` | Security engineer |
| `qa-testing` | QA / Testing / SDET |
| `ux-design` | UX / UI design |
| `product` | Product management |
| `technical-writing` | Technical writing / docs |
| `game-dev` | Game development |
| `embedded` | Embedded / firmware |
| `research` | Research / academia |

[Add a specialty →](https://github.com/adhenawer/claude-setups-registry/edit/master/data/specialties.yml)

## Validation

Every submission is validated before ingestion:

- Schema version compatibility
- Slug format (`[a-z0-9][a-z0-9-]{1,49}`)
- Author match (issue opener must match descriptor author)
- MCP `env` sections rejected (never accepted)
- Bundle paths restricted to `hooks/`, `skills/`, `commands/`, `agents/`, root `*.md`
- `settings.json` and `.claude.json` blocked in bundles
- Path traversal (`..`) and absolute paths rejected

## Moderation

- **Submission**: `setup:submission` issues → [`ingest.yml`](.github/workflows/ingest.yml) validates and commits
- **Revocation**: `setup:revoke` issues → [`moderate.yml`](.github/workflows/moderate.yml) verifies author and removes

## Publishing a Setup

Use the CLI (this repo is the backend, not used directly):

```bash
npx -y claude-setups publish --with-bundle
```

See [claude-setups](https://github.com/adhenawer/claude-setups) for full documentation.

## Contributing

- **Add a setup**: Use the CLI (`npx -y claude-setups publish`)
- **Add a specialty**: PR to [`data/specialties.yml`](data/specialties.yml)
- **Improve the gallery**: PRs to `site/` welcome
- **Report issues**: [Open an issue](https://github.com/adhenawer/claude-setups-registry/issues)

## License

[MIT](LICENSE)
