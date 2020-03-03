#!/bin/bash
java -cp "$VIDEOS_JARFILE" frt.videos.SendSingleKt ${1+"$@"}
