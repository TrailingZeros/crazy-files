#!/bin/bash
set -ex
echo "$REPO/data-${1:-1}.git"
git -C "${2:-bkup}" init || true
git -C "${2:-bkup}" add .
git -C "${2:-bkup}" commit -am. || true
git -C "${2:-bkup}" remote add origin "$REPO/${VIDEOS_PREFIX:-data}-${1:-1}.git" || true
git -C "${2:-bkup}" push -u origin master
rm -rf "${2:-bkup}"
