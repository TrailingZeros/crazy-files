#!/bin/bash
java -cp "$VIDEOS_JARFILE" frt.videos.EncodeKt ${1+"$@"}
