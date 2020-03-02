#!/bin/bash
java -cp "$VIDEOS_JARFILE" frt.videos.GifKt ${1+"$@"}
