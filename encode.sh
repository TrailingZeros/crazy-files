#!/bin/bash
IN="$1"
OUT="${IN%.*}.webm"
/usr/bin/ffmpeg -i "${IN}" -vcodec libvpx -acodec libopus -ac 2 -r 30 -max_muxing_queue_size 1024 "${OUT}"
