#!/bin/bash
java -cp "$VIDEOS_JARFILE" frt.videos.PresplitKt ${1+"$@"}
