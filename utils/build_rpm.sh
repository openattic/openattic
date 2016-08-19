#!/bin/bash
#
#  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
#
#  openATTIC is free software; you can redistribute it and/or modify it
#  under the terms of the GNU General Public License as published by
#  the Free Software Foundation; version 2.
#
#  This package is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
# To build RPM packages using this script, make sure to include
# the following macro definitions in $HOME/.rpmmacros:
#
# %_topdir %(echo $HOME)/rpmbuild
# %_signature gpg
# %_gpg_name <GPG Key ID>

set -e
set -u
# set -x

export LANG=C

if [ -z "${1:-}" ]; then
	echo "Usage:" >&2
	echo -e "\t$0 <tarball>" >&2
	echo >&2
	echo -e "\tBuild signed RPM packages from a given tar archive." >&2
	echo >&2
	echo -e "\t<tarball> is the path to an openATTIC source distribution" >&2
	echo -e "\ttar archive which must include pre-built WebUI parts" >&2
	echo -e "\t(usually built by build_dist.py)." >&2
	echo >&2
	echo -e "\tYou can use \"-\" to pass the tarball name via STDIN." >&2
	echo >&2
	exit 1
fi

if [ "$1" == "-" ] ; then
  read PKGDIST
else
  PKGDIST="$1"
fi

if [ ! -f "$PKGDIST" ] ; then
	echo "Error: $PKGDIST not found." >&2
	exit 1
fi

TOPDIR=$(rpm -E "%{_topdir}")

# This requires the "rpmdev" package to be installed
if [ ! -d "$TOPDIR" ] ; then
    rpmdev-setuptree
fi

# Clean up build environment
rm -rf "$TOPDIR/SOURCES/openattic"
rm -rf "$TOPDIR/BUILD"/openattic-[0-9]*
rm -rf "$TOPDIR/BUILDROOT"/openattic-[0-9]*
rm -f "$TOPDIR/SOURCES"/openattic-[0-9]*.tar.bz2
rm -f "$TOPDIR/RPMS"/*/openattic*-[0-9]*.rpm
rm -f "$TOPDIR/SRPMS/"openattic-[0-9]*.rpm

# Extract version.txt and the RPM specfile from the tarball
PKGDIR=$(basename $PKGDIST | sed s/.tar.bz2//)
echo "PKGDIR: $PKGDIR"
VERSIONFILE="$PKGDIR/version.txt"
SPECFILE="$PKGDIR/rpm/openattic.spec"
TMPDIR=$(mktemp -d)
echo "Extracting version.txt and RPM spec file..."
tar jxf "$PKGDIST" -C "$TMPDIR" "$VERSIONFILE" "$SPECFILE"

# Determine the package version and build date from version.txt
# Can't source the file directly due to the ini-Style section header.
# Yes, I could simply parse the source package name, but this seems
# a more reliable way to do it...
VERSION=$(grep VERSION "$TMPDIR/$VERSIONFILE" | cut -d= -f2 | tr -d "[:blank:]")
STATE=$(grep STATE "$TMPDIR/$VERSIONFILE" | cut -d= -f2 | tr -d "[:blank:]")
BUILDDATE=$(grep BUILDDATE "$TMPDIR/$VERSIONFILE" | cut -d= -f2 | tr -d "[:blank:]")
echo "VERSION: $VERSION"
echo "STATE: $STATE"
echo "BUILDDATE: $BUILDDATE"

# Put RPM spec file and tarball into the RPM build environment
mv "$TMPDIR/$SPECFILE" "$TOPDIR/SPECS/"
cp "$PKGDIST" "$TOPDIR/SOURCES/"
rm -rf "$TMPDIR"

if [ "$STATE" == "release" ]; then
	RELEASE="1"
else
	VERSION="$VERSION~$BUILDDATE"
	RELEASE="1"
fi

# Build and sign the RPM packages
rpmbuild --rmsource --rmspec --clean --sign -ba \
  -D "VERSION $VERSION" \
  -D "RELEASE $RELEASE" \
  "$TOPDIR/SPECS/openattic.spec"
