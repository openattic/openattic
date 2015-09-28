#!/bin/bash

set -e
set -u

# make sure we're cd'ed to the correct directory
MYPATH="$(dirname `readlink -f "$0"`)"
cd "$MYPATH"

export PYTHONPATH=/srv/openattic/backend
export DJANGO_SETTINGS_MODULE=settings
export http_proxy="http://proxy.master.dns:8080/"
export https_proxy="http://proxy.master.dns:8080/"

make html
#make singlehtml

if [ "${1:-}" = "--nolatex" ]; then
	exit 0
fi

make latexpdf
