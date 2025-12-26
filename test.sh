#!/bin/bash

# 定义字体路径 (根据你的实际情况)
FONT_REL_PATH="public/fonts/AlibabaPuHuiTi-3-105-Heavy.ttf"
PWD=$(pwd)
FONT_ABS_PATH="$PWD/$FONT_REL_PATH"

echo "============================================"
echo "1. 环境基础检查"
echo "当前工作目录: $PWD"
echo "检查字体文件是否存在 (相对路径): $FONT_REL_PATH"
if [ -f "$FONT_REL_PATH" ]; then
    echo "✅ 文件存在"
else
    echo "❌ 文件不存在! 请检查目录结构"
    exit 1
fi

echo "============================================"
echo "2. 测试 anullsink (空音频接收器)"
echo "你的报错日志里用到了这个滤镜，如果 FFmpeg 缺少它会报 Filter not found"

/usr/local/bin/ffmpeg -v error -f lavfi -i anullsrc=r=44100:cl=stereo:d=1 \
-filter_complex "[0:a]anullsink" \
-f null -

if [ $? -eq 0 ]; then
    echo "✅ anullsink 滤镜正常"
else
    echo "❌ anullsink 滤镜不支持! 你的 FFmpeg 可能缺失基础滤镜"
fi

echo "============================================"
echo "3. 测试 drawtext (使用绝对路径)"
echo "测试路径: $FONT_ABS_PATH"

/usr/local/bin/ffmpeg -v error -y \
-f lavfi -i color=c=black:s=640x360:d=1 \
-vf "drawtext=text='TestAbs':fontfile='$FONT_ABS_PATH':fontsize=24:fontcolor=white" \
-f mp4 /dev/null

if [ $? -eq 0 ]; then
    echo "✅ drawtext (绝对路径) 正常"
else
    echo "❌ drawtext (绝对路径) 失败"
fi

echo "============================================"
echo "4. 测试 drawtext (使用相对路径)"
echo "测试路径: $FONT_REL_PATH"
echo "注意：FFmpeg 对相对路径的支持依赖于运行目录"

/usr/local/bin/ffmpeg -v error -y \
-f lavfi -i color=c=black:s=640x360:d=1 \
-vf "drawtext=text='TestRel':fontfile='$FONT_REL_PATH':fontsize=24:fontcolor=white" \
-f mp4 /dev/null

if [ $? -eq 0 ]; then
    echo "✅ drawtext (相对路径) 正常"
else
    echo "❌ drawtext (相对路径) 失败. 这说明必须在代码里把路径转为绝对路径"
fi

echo "============================================"
echo "测试结束"
