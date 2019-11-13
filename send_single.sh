#!/bin/bash
set -ex
echo "$REPO/data-${1:-1}.git"
if git -C "${2:-bkup}" init | grep Reinit &>/dev/null ; then
  true
else
  git -C "${2:-bkup}" remote add origin "$REPO/${VIDEOS_PREFIX:-data}-${1:-1}.git" || true
  for II in $REPO{1..10} ; do
    git -C "${2:-bkup}" config --add remote.origin.url "$II/${VIDEOS_PREFIX:-data}-$1.git"
  done
fi
git -C "${2:-bkup}" add .
git -C "${2:-bkup}" commit -am. || true

n=0
until [ $n -ge 5 ]
do
  git -C "${2:-bkup}" push -u origin master && break
  n=$[$n+1]
done
rm -rf "${2:-bkup}"
