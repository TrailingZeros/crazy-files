#!/bin/bash
java -cp "$VIDEOS_JARFILE" frt.videos.SendKt ${1+"$@"}
