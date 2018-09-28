#!/bin/bash
ls *.zip -1 | grep -v utf8 | sort | while read line ; do
  ./zip932toutf8.groovy $line
done
