#!/bin/bash
IN="$1"
OUT="${IN%.*}.mp4"
/usr/bin/ffmpeg -i "${IN}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${OUT}"
