#!/bin/bash
for NN in "$@" ; do
  IN="$NN"
  OUT="${IN%.*}.mp3"
  /usr/bin/ffmpeg -i "${IN}" -vn -max_muxing_queue_size 1024 "${OUT}"
done
