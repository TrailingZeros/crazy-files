#!/bin/bash
set -xe
find . -maxdepth 3 -size +500000000c -print | grep -vE '\.split$' | \
    grep -v 'audio/' | grep -v 'ok/' | \
    grep -vE '.+\.f[0-9]+\..+\.part' | while read i ; do
  split -a 5 -b 10M -d --additional-suffix=.split --verbose "$i" "${i}."
  rm "$i"
done
