#!/bin/bash
0<&-
: | java -cp "$VIDEOS_JARFILE" frt.videos.EncodeAllKt ${1+"$@"}
