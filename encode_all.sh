#!/bin/bash
ls -1 *.{mp4,mkv,mov,m4v,flv} | sort | while read i
do
  #: | grep man
  echo "$i"
  : | ./encode.sh "$i"
done
