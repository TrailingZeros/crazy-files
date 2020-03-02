#!/bin/bash
java -cp "$VIDEOS_JARFILE" frt.videos.Mp3Kt ${1+"$@"}
