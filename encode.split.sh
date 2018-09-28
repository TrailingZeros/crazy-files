#!/bin/bash
IN="$1"
OUT="${IN%.*}.webm"
TMPN="$(pwgen 10 1)"
TMPV="tmp/$TMPN.mkv"
TMPA="tmp/$TMPN.ogg"

trap "rm $TMPV $TMPA" SIGINT EXIT

/usr/bin/ffmpeg -i "${IN}" -vcodec libvpx -an -r 30 -max_muxing_queue_size 1024 "${TMPV}" &
/usr/bin/ffmpeg -i "${IN}" -vn -acodec libopus -ac 2 -max_muxing_queue_size 1024 "${TMPA}" &

for i in $(jobs -p) ; do
    wait "$i"
done

/usr/bin/ffmpeg -i "$TMPV" -i "$TMPA" -c:v copy -c:a copy "$OUT"
