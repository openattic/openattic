#!/bin/bash

set -e
set -u

if [ $# != 1 ]; then
	echo "Usage: $0 <file>"
	exit 1
fi

LN=`grep -n "{% endcomment %}" $1 | cut -d: -f1`

TEMPFILE=`tempfile -s js`
trap "rm -f -- '$TEMPFILE'" EXIT

if [ ! -z "$LN" ]; then
	# Strip out the django {% comment %} stuff
	tail -n+$((LN+1)) "$1" > "$TEMPFILE"
else
	cp "$1" "$TEMPFILE"
fi

# Try to find API calls like lvm__LogicalVolume, samba__Share, and define them
ADDVARS=` grep -o -w -P '[a-z]+__[a-zA-Z]+' "$TEMPFILE" | sort | uniq | tr '\n' ',' `

# Now lint, and replace the filename in the output
java -jar /usr/local/share/jslint4java-2.0.2.jar --indent 2 --maxlen 120  \
	--predef Ext,MEDIA_URL,tipify,$ADDVARS --vars --browser --white \
	--maxerr 500 "$TEMPFILE" | sed "s#:$TEMPFILE:#:$1:#g"
