#!/bin/bash
for NN in "$@" ; do
  IN="$NN"
  OUT="${IN%.*}.ogg"
  /usr/bin/ffmpeg -i "${IN}" -vn -acodec libopus -max_muxing_queue_size 1024 "${OUT}"
done
