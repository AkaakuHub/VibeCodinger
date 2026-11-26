# Release Runbook

A push to `main` runs CI. Once `Check` passes, the same run builds and publishes the desktop installers, CLI archives, unsigned iPhone IPA, and Android APK to GitHub Releases. The release tag is `v<desktop version>-pr.<run number>.<run attempt>`.

Verify the CI run and published assets for the same commit before distributing the release. The desktop updater reads the platform's `latest*.yml` file. CLI and managed-server updates verify the archive against `SHA256SUMS`.

macOS builds without Developer ID signing can check for updates and open the release page. For in-app installation, configure `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_API_KEY`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`, and `MACOS_PROVISIONING_PROFILE` as repository secrets and `APPLE_TEAM_ID` as a repository variable.
