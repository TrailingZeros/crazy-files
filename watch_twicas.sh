#!/bin/bash
java -cp "$VIDEOS_JARFILE" frt.videos.WatchTwicasKt ${1+"$@"}
