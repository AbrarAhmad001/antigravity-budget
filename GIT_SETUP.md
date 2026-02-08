# Git Setup and Push to GitHub

## Step 1: Configure Git (First-time setup)
**You need to run these commands ONCE in a NEW terminal:**

```powershell
# Set Git path (in new terminal)
$env:Path += ";C:\Program Files\Git\cmd"

# Configure your Git identity
git config --global user.name "Abrar Ahmad"
git config --global user.email "your-email@example.com"
```

## Step 2: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `antigravity-budget`
3. Description: "Multi-modal expense tracker with LLM processing"
4. **DO NOT** check "Initialize this repository with a README"
5. Click "Create repository"

## Step 3: Initialize and Push Code
**Run these commands in your terminal:**

```powershell
# Navigate to project
cd E:\winter2026\projects\antigravity_budget

# Add Git to PATH (if new terminal)
$env:Path += ";C:\Program Files\Git\cmd"

# Initialize Git repository
git init

# Add all files (credentials.json is already in .gitignore, won't be added)
git add .

# Commit
git commit -m "Initial commit: Multi-modal expense tracker with LLM"

# Add remote (use your actual GitHub username)
git remote add origin https://github.com/AbrarAhmad001/antigravity-budget.git

# Rename default branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 4: Verify
Go to https://github.com/AbrarAhmad001/antigravity-budget and you should see your code!

## Troubleshooting

### Authentication Required
If GitHub asks for authentication:
1. **Username**: AbrarAhmad001
2. **Password**: Use a Personal Access Token (NOT your GitHub password)
   - Create one at: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (full control)
   - Copy the token and use it as the password

### "Git not found" error
- Close the terminal and open a NEW one
- Run: `$env:Path += ";C:\Program Files\Git\cmd"`
