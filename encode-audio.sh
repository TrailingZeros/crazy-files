#!/bin/bash
IN="$1"
OUT="${IN%.*}.ogg"
/usr/bin/ffmpeg -i "${IN}" -acodec libopus "${OUT}"
