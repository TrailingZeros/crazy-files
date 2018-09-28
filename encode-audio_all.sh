#!/bin/bash
ls -1 *.{mp3,aac,wav,m4a,3gp} | sort | while read i
do
  #: | grep man
  echo "$i"
  : | ./encode-audio.sh "$i"
done
