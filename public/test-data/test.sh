#!/bin/bash

# =================================================================
# 目标：复现 "Invalid argument" 报错
# 假设：问题出在音频流的 concat=n=1 上
# =================================================================

FFMPEG_BIN="/usr/local/bin/ffmpeg"

echo "=== 🧪 终极验证: 视频+音频 混合 Concat 测试 ==="

# 我们模拟一个完全相同的滤镜链结构：
# 1. 视频流：Source -> Concat(n=1) -> Overlay -> [v_out]
# 2. 音频流：Source -> Concat(n=1) -> [a_out]  <-- 重点怀疑这里

$FFMPEG_BIN -y -v error \
-f lavfi -i color=c=black:s=1280x720:d=1 \
-f lavfi -i sine=f=440:d=1 \
-filter_complex "
[0:v]trim=duration=1[v_seg];
[v_seg]concat=n=1:v=1:a=0[v_concat];
[v_concat]null[v_masked];
[1:a]atrim=duration=1[a_seg];
[a_seg]concat=n=1:v=0:a=1[a_concat];
[a_concat]anull[a_final]
" \
-map "[v_masked]" \
-map "[a_final]" \
-f null -

RET=$?

if [ $RET -ne 0 ]; then
    echo ""
    echo "🚨🚨🚨 复现成功！🚨🚨🚨"
    echo "FFmpeg 报错退出 (Code $RET)。"
    echo "证据确凿：在处理音频流时，concat=n=1 导致了崩溃！"
else
    echo ""
    echo "✅ 测试通过 (未复现报错)。"
    echo "说明 concat=n=1 本身没问题，问题可能出在更复杂的 amix 环节。"
fi
