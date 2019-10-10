#!/bin/bash
set -xe
if [ "$1" == "" ] ; then
  name(){
    pwgen 10 1
  }
else
  NUMT="$(mktemp)"
  echo $1 > $NUMT
  trap "rm $NUMT" SIGINT EXIT
  name(){
    NUM="$(cat $NUMT)"
    echo $NUM
    echo $(($NUM+1)) > $NUMT
  }
fi

./presplit.sh
while ./crypto; do
  ./send_single.sh "$(name)"
  ./presplit.sh
done

./unsent
