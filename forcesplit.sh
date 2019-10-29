#!/bin/bash
set -xe
for j in "$@" ; do echo "$j" ; done | grep -vE '\.split$' | \
    grep -vE '.+\.f[0-9]+\..+\.part' | while read i ; do
  split -a 3 -b 10M -d --additional-suffix=.split --verbose "$i" "${i}."
  rm "$i"
done
