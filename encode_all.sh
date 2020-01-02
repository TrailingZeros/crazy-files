#!/bin/bash
ls -1 *.{mp4,mkv,mov,m4v,flv,wmv,avi} | sort | while read i
do
  #: | grep man
  echo "$i" 1>&2
  : | ./encode.sh "$i"
done
