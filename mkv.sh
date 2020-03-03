#!/bin/bash
java -cp "$VIDEOS_JARFILE" frt.videos.MkvKt ${1+"$@"}
