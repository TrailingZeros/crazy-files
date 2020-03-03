#!/bin/bash
java -cp "$VIDEOS_JARFILE" frt.videos.ForceSplitKt ${1+"$@"}
