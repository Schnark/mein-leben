#!/bin/sh
for D in $(seq -w 31)
do
    wget -q -O - "https://www.badische-zeitung.de/archiv/$1/$D" | grep --text $2 && echo "$1/$D"
done