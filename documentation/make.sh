#!/bin/bash

set -e
set -u

# make sure we're cd'ed to the correct directory
MYPATH="$(dirname `readlink -f "$0"`)"
cd "$MYPATH"

export PYTHONPATH=/srv/openattic
export DJANGO_SETTINGS_MODULE=settings
export http_proxy="http://proxy.master.dns:8080/"
export https_proxy="http://proxy.master.dns:8080/"

./integration/api/rpcapi/make.sh

make html
#make singlehtml

if [ "${1:-}" = "--nolatex" ]; then
	exit 0
fi

make latexpdf
