#!/bin/bash
set -xe
find . -maxdepth 3 -size +1000000000c -print | grep -vE '\.split$' | \
    grep -vE '.+\.f[0-9]+\..+\.part' | while read i ; do
  split -a 3 -b 10M -d --additional-suffix=.split --verbose "$i" "${i}."
  rm "$i"
done
