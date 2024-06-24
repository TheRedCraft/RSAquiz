
    @echo off
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git push -u origin main
    del /F commit.bat
    