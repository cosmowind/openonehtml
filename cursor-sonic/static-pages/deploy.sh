#!/bin/bash

# OpenOneHTML 静态版本部署脚本
echo "OpenOneHTML 静态版本部署工具"
echo "================================"

# 检查参数
if [ $# -eq 0 ]; then
    echo "使用方法:"
    echo "  $0 github <仓库名>    # 部署到GitHub"
    echo "  $0 gitee <仓库名>     # 部署到Gitee"
    echo "  $0 local             # 本地预览"
    exit 1
fi

PLATFORM=$1
REPO_NAME=$2

case $PLATFORM in
    "github")
        if [ -z "$REPO_NAME" ]; then
            echo "请提供GitHub仓库名"
            echo "示例: $0 github my-repo"
            exit 1
        fi

        echo "正在部署到GitHub Pages..."
        echo "仓库名: $REPO_NAME"

        # 初始化git仓库（如果还没有的话）
        if [ ! -d ".git" ]; then
            git init
            git add .
            git commit -m "Initial commit for static version"
        fi

        # 添加远程仓库
        git remote add origin https://github.com/$(whoami)/$REPO_NAME.git 2>/dev/null || true
        git remote set-url origin https://github.com/$(whoami)/$REPO_NAME.git

        # 推送代码
        git add .
        git commit -m "Deploy static version" || true
        git branch -M main
        git push -u origin main

        echo "部署完成！"
        echo "请在GitHub仓库设置中启用Pages功能"
        echo "访问地址: https://$(whoami).github.io/$REPO_NAME"
        ;;

    "gitee")
        if [ -z "$REPO_NAME" ]; then
            echo "请提供Gitee仓库名"
            echo "示例: $0 gitee my-repo"
            exit 1
        fi

        echo "正在部署到Gitee Pages..."
        echo "仓库名: $REPO_NAME"

        # 初始化git仓库（如果还没有的话）
        if [ ! -d ".git" ]; then
            git init
            git add .
            git commit -m "Initial commit for static version"
        fi

        # 添加远程仓库
        git remote add origin https://gitee.com/$(whoami)/$REPO_NAME.git 2>/dev/null || true
        git remote set-url origin https://gitee.com/$(whoami)/$REPO_NAME.git

        # 推送代码
        git add .
        git commit -m "Deploy static version" || true
        git branch -M main
        git push -u origin main

        echo "部署完成！"
        echo "请在Gitee仓库设置中启用Pages功能"
        echo "访问地址: https://$(whoami).gitee.io/$REPO_NAME"
        ;;

    "local")
        echo "启动本地预览服务器..."
        if command -v python3 &> /dev/null; then
            python3 -m http.server 8000
        elif command -v python &> /dev/null; then
            python -m SimpleHTTPServer 8000
        else
            echo "请安装Python或手动打开index.html文件"
            exit 1
        fi
        ;;

    *)
        echo "不支持的平台: $PLATFORM"
        echo "支持的平台: github, gitee, local"
        exit 1
        ;;
esac

