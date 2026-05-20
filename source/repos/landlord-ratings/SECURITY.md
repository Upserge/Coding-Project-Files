# Security

## API keys and environment variables

- Copy `.env.example` to `.env` and fill in values locally.
- **Never commit** `.env` or any file containing API keys, Firebase service account JSON, or signing certificates.
- Firebase **web** client keys in `.env` are restricted by domain/app in Google Cloud / Firebase Console; still treat them as sensitive.

## Before pushing to GitHub

```bash
git status
git diff --cached --name-only | grep -E '\.env|serviceAccount|google-services|GoogleService'
```

The above should return **no matches**.

## If secrets were committed

1. Rotate keys in [Google Cloud Console](https://console.cloud.google.com/) and [Firebase Console](https://console.firebase.google.com/).
2. Remove secrets from git history (e.g. `git filter-repo` or GitHub secret scanning guidance).
