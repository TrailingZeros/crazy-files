#!/bin/bash
IN="$1"
OUT="${IN%.*}.gif"
/usr/bin/ffmpeg -i "${IN}" -r 10 -max_muxing_queue_size 1024 \
    -map_chapters -1 -map_metadata -1 "${OUT}"
