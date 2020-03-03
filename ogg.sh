#!/bin/bash
java -cp "$VIDEOS_JARFILE" frt.videos.OggKt ${1+"$@"}
