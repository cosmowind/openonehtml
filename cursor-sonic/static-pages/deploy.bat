@echo off
REM OpenOneHTML 静态版本部署工具 (Windows)
echo OpenOneHTML 静态版本部署工具
echo ================================

REM 检查参数
if "%1"=="" (
    echo 使用方法:
    echo   %0 github ^<仓库名^>    # 部署到GitHub
    echo   %0 gitee ^<仓库名^>     # 部署到Gitee
    echo   %0 local              # 本地预览
    goto :eof
)

set PLATFORM=%1
set REPO_NAME=%2

if "%PLATFORM%"=="github" (
    if "%REPO_NAME%"=="" (
        echo 请提供GitHub仓库名
        echo 示例: %0 github my-repo
        goto :eof
    )

    echo 正在部署到GitHub Pages...
    echo 仓库名: %REPO_NAME%

    REM 初始化git仓库（如果还没有的话）
    if not exist ".git" (
        git init
        git add .
        git commit -m "Initial commit for static version"
    )

    REM 添加远程仓库
    git remote add origin https://github.com/%USERNAME%/%REPO_NAME%.git 2>nul
    git remote set-url origin https://github.com/%USERNAME%/%REPO_NAME%.git

    REM 推送代码
    git add .
    git commit -m "Deploy static version" 2>nul
    git branch -M main
    git push -u origin main

    echo 部署完成！
    echo 请在GitHub仓库设置中启用Pages功能
    echo 访问地址: https://%USERNAME%.github.io/%REPO_NAME%
    goto :eof
)

if "%PLATFORM%"=="gitee" (
    if "%REPO_NAME%"=="" (
        echo 请提供Gitee仓库名
        echo 示例: %0 gitee my-repo
        goto :eof
    )

    echo 正在部署到Gitee Pages...
    echo 仓库名: %REPO_NAME%

    REM 初始化git仓库（如果还没有的话）
    if not exist ".git" (
        git init
        git add .
        git commit -m "Initial commit for static version"
    )

    REM 添加远程仓库
    git remote add origin https://gitee.com/%USERNAME%/%REPO_NAME%.git 2>nul
    git remote set-url origin https://gitee.com/%USERNAME%/%REPO_NAME%.git

    REM 推送代码
    git add .
    git commit -m "Deploy static version" 2>nul
    git branch -M main
    git push -u origin main

    echo 部署完成！
    echo 请在Gitee仓库设置中启用Pages功能
    echo 访问地址: https://%USERNAME%.gitee.io/%REPO_NAME%
    goto :eof
)

if "%PLATFORM%"=="local" (
    echo 启动本地预览服务器...
    if exist "python.exe" (
        python -m http.server 8000
    ) else (
        echo 请安装Python或手动打开index.html文件
    )
    goto :eof
)

echo 不支持的平台: %PLATFORM%
echo 支持的平台: github, gitee, local
goto :eof

