#!/bin/bash
for NN in "$@" ; do
  IN="$NN"
  OUT="${IN%.*}.mkv"
  /usr/bin/ffmpeg -i "${IN}" -vcodec copy -acodec copy -max_muxing_queue_size 1024 "${OUT}"
done
