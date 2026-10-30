# Security-gated GitHub Pages publishing

**Status: not yet activated.** This source-controlled workflow automatically denies new GitHub Pages deployments unless `hungtranbkit/project-standards` on `main` contains an independently reviewed release proof under `approvals/hungtranbkit/routerflow-landing/<exact-GitHub-commit-SHA>/release-gate.json` and all required `static-landing` controls pass.

The `security-public-release` job is a strict prerequisite of `publish-pages`. Public artifact building is allowlisted in `scripts/build-pages-artifact.sh` to prevent leaking source, .git, docs/security or CI configuration.

**ONE-TIME PLATFORM CONFIGURATION REQUIRED:** GitHub → this repository → Settings → Pages → Build and deployment → Source: **GitHub Actions**, not **Deploy from a branch**. Until switched, GitHub Pages may keep publishing `main` directly; this PR alone cannot stop it. Choose GitHub Actions only after independent security review and confirmation the new workflow can deploy, otherwise the current live static page will stay at its last version.

Do not add a fake PASS approval just to publish. The independent security review record is created after freezing the exact SHA, in the separate standards repository, so it avoids the circularity of trying to put the same commit's own SHA inside that commit. No automatic security certification is claimed; the **check** is automatic, while evidence collection and independent approval remain required.

No live deployment or Pages setting was changed in this PR.
