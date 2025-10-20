# 🚀 GitHub Push Guide

## Prerequisites
- Git installed
- GitHub account
- Repository created on GitHub

## Step 1: Initialize Git (if not already done)

```powershell
cd c:\staj-partsoft\gps-shortest-path

# Check if git is initialized
git status

# If not initialized
git init
```

## Step 2: Configure Git

```powershell
# Set your name and email
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## Step 3: Stage All Files

```powershell
# Add all files (respects .gitignore)
git add .

# Check what will be committed
git status
```

## Step 4: Create First Commit

```powershell
git commit -m "Initial commit: GPS Shortest Path delivery optimization system

Features:
- Advanced TSP algorithm for route optimization
- Multi-stop routing with OSRM integration
- Role-based access control (Admin, Manager, Employee, Driver)
- Delivery grouping and tracking
- Interactive Leaflet maps with dynamic centering
- PostgreSQL database with Sequelize ORM
- Next.js 14 frontend with TypeScript
- Docker containerization support
- Comprehensive API documentation"
```

## Step 5: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `gps-shortest-path`
3. Description: "Delivery route optimization system using TSP algorithms"
4. **Keep it Public** (or Private if preferred)
5. **Do NOT initialize with README, .gitignore, or license** (we already have them)
6. Click "Create repository"

## Step 6: Connect to GitHub

```powershell
# Add remote (replace USERNAME with your GitHub username)
git remote add origin https://github.com/USERNAME/gps-shortest-path.git

# Verify remote
git remote -v
```

## Step 7: Push to GitHub

```powershell
# Push to main branch
git push -u origin main

# Or if your default branch is master
git branch -M main
git push -u origin main
```

## Step 8: Verify on GitHub

1. Go to https://github.com/USERNAME/gps-shortest-path
2. Verify all files are present
3. Check README.md is displayed nicely
4. Verify .env files are NOT visible (they should be ignored)

## Troubleshooting

### Authentication Error (Username/Password)
GitHub no longer accepts password authentication. Use Personal Access Token:

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use token as password when prompted

```powershell
git push -u origin main
# Username: your-github-username
# Password: your-personal-access-token
```

### Or use GitHub CLI

```powershell
# Install GitHub CLI
winget install GitHub.cli

# Authenticate
gh auth login

# Push
git push -u origin main
```

### Already Have Different Remote

```powershell
# Remove existing remote
git remote remove origin

# Add correct remote
git remote add origin https://github.com/USERNAME/gps-shortest-path.git

# Push
git push -u origin main
```

### Branch Name Mismatch

```powershell
# Rename branch to main
git branch -M main

# Push
git push -u origin main
```

## Adding Changes Later

```powershell
# Check what changed
git status

# Stage specific files
git add path/to/file.js

# Or stage all changes
git add .

# Commit
git commit -m "Description of changes"

# Push
git push
```

## Useful Git Commands

```powershell
# View commit history
git log --oneline

# View changes
git diff

# Undo staged changes
git reset HEAD filename

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View branches
git branch -a

# Create and switch to new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main
```

## Repository Settings (Optional)

After pushing, configure repository settings:

1. **About Section**
   - Add description
   - Add website URL
   - Add topics: `typescript`, `nextjs`, `nodejs`, `postgresql`, `routing`, `tsp-algorithm`, `delivery-management`

2. **Enable GitHub Pages** (for documentation)
   - Settings → Pages
   - Source: Deploy from main branch `/docs`

3. **Branch Protection** (for main branch)
   - Settings → Branches
   - Add rule for `main`
   - Require pull request reviews

4. **Secrets** (for CI/CD)
   - Settings → Secrets and variables → Actions
   - Add: `DB_PASSWORD`, `JWT_SECRET`, etc.

## Next Steps

- Add GitHub Actions for CI/CD
- Add badges to README
- Create CONTRIBUTING.md
- Set up issue templates
- Configure Dependabot
- Add code of conduct

## Success! 🎉

Your project is now on GitHub. Share the link:
`https://github.com/USERNAME/gps-shortest-path`
