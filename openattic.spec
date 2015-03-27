Name:           openattic
Version:        1.2
Release:        1%{?dist}
Summary:        OpenAttic Comprehensive Storage Management System

Group:          System Environment/Libraries
License:        GPLv2
URL:            https://www.openattic.org
BuildArch: 	noarch
Source:		openattic.tar.bz2


%global hgrepo   https://bitbucket.org/openattic/openattic

## Dokumentation at https://fedoraproject.org/wiki/How_to_create_an_RPM_package
#Requires:	zfs-release
#Requires:	epel-release
Requires: 	openattic-base
Requires:	openattic-module-cron
Requires:	openattic-module-lvm
Requires:	openattic-module-nfs
Requires:	openattic-module-http
Requires:	openattic-module-samba
Requires:	openattic-module-nagios
Requires:	openattic-module-mailaliases
Requires:	openattic-pgsql

BuildRequires:  mercurial

##
##  requires djextdirect python plugin
#   Install manually with:
# wget https://bitbucket.org/Svedrin/djextdirect/get/v0.10.tar.bz2
# tar xjfv v0.10.tar.bz2
# cd Svedrin-djextdirect-00d267d0d9aa
# python setup.py install
#
# => TODO: Create package/spec file for this
#

##
## requires libjs-extjs4
#  Install manually with
# cd /srv
# wget http://apt.open-attic.org/pool/main/libj/libjs-extjs4/libjs-extjs4_4.2.1.orig.tar.bz2
# tar xjfv libjs-extjs4_4.2.1.orig.tar.bz2
# chown -R apache:apache /srv/ext-4.2.1.883/
# #add /srv as managed context
# semanage fcontext -a -t httpd_sys_rw_content_t "/srv/ext-4.2.1.883(/.*)?"
# restorecon-vvR .

%description 
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 It comes with an extensible API focused on modularity, so you can tailor
 your installation exactly to your needs and embed openATTIC in your existing
 data center infrastructure.
 .
 This metapackage installs the most common set of openATTIC modules along
 with the basic requirements. Those modules are:
 .
  * LVM
  * NFS
  * HTTP
  * LIO (iSCSI, FC)
  * Samba
  * Nagios
  * Cron
  * MailAliases (EMail configuration)
 .
 You can install additional modules yourself or use the openattic-full package.
 .
 Upstream URL: http://www.openattic.org
 
%package       base
Requires:	python-memcached 
Requires:	memcached
Requires:	python-pip
Requires:	python-imaging 
Requires:	numpy 
Requires:	python-rtslib
Requires:	wget 
Requires:	bzip2
Requires:	oxygen-icon-theme
Requires:	python-django 
Requires:	python-psycopg2 
Requires:	dbus 
Requires:	ntp 
Requires:	bridge-utils 
Requires:	vconfig 
Requires:	python-dbus 
Requires:	pygobject2 
Requires:	python-pam 
Requires:	python-m2ext 
Requires:	m2crypto 
Requires:	python-netifaces 
Requires:	python-netaddr 
Requires:	python-pyudev 
Requires:	mod_wsgi 
Requires:	xfsprogs 
Requires:	udisks2 
Requires:	libjs-extjs4
Requires:	djangorestframework
Requires:	djangorestframework-bulk
Requires:	django-filter
Summary:  Basic requirements for openATTIC
 
%description base
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 This package installs the basic framework for openATTIC, which consists
 of the RPC and System daemons and the Web Interface. You will not be able
 to manage any storage using *just* this package, but the other packages
 require this one to be available.
 
%package       module-btrfs
Requires:	btrfs-progs 
Summary:  BTRFS module for openATTIC
 
%description module-btrfs
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 This package includes support for BTRFS, a new copy on write filesystem for
 Linux aimed at implementing advanced features while focusing on fault
 tolerance, repair and easy administration.
 
%package       module-cron
Requires:	/usr/sbin/crond
Summary:  Cron module for openATTIC
 
%description module-cron
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 Cron is a service that provides scheduled task execution. This package
 provides configuration facilities for scheduled tasks (a.k.a. Cron jobs).
 
%package       module-drbd
Requires:	drbd84-utils 
Requires:	kmod-drbd84
Summary:  DRBD module for openATTIC
 
%description module-drbd
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 LINBIT's Distributed Replicated Block Device is a data replication tool that
 mirrors volumes to another openATTIC host in a block oriented fashion. It is
 often referred to as RAID-1 over IP.
 .
 This module provides the groundwork for building high availability clusters
 using openATTIC.
 
%package       module-ftp
Requires: 	proftpd
Summary:  FTP module for openATTIC
 
%description module-ftp
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 The File Transfer Protocol is one of the most widely supported protocols for
 transferring files on the internet. This package provides a configuration
 interface along with a ProFTPd server configuration that uses the openATTIC
 database as configuration backend.
 
%package       module-http
Requires:	httpd
Summary:  HTTP module for openATTIC
 
%description module-http
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 The Hypertext Transfer Protocol is not only used for serving web sites, but
 can also be used for serving other files in a read-only fashion. This is
 commonly used for disk images or software repositories.
 .
 This package installs a module which allows you to share volumes or
 subdirectories using Apache2.
 
%package       module-ipmi
#require freeipmi oder OpenIPMI ??
Summary:  IPMI module for openATTIC
 
%description module-ipmi
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 IPMI can be used to query a set of sensors installed in the system. This
 module displays the current state of these sensors in the openATTIC GUI.
 
%package       module-lio
# Welche Pakte werden hierfür benötigt
Summary:  LIO module for openATTIC
 
%description module-lio
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 This package includes support for the LIO Linux SCSI Target, which allows
 users to configure FibreChannel, FCoE and iSCSI targets over the openATTIC
 user interface.
 
%package       module-lvm
Requires:	lvm2 
Summary:  LVM module for openATTIC
 
%description module-lvm
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 Handles partitioning of physical disks into volumes using the Linux Logical
 Volume Manager. LVM supports enterprise level volume management of disk
 and disk subsystems by grouping arbitrary disks into volume groups. The
 total capacity of volume groups can be allocated to logical volumes, which
 are accessed as regular block devices.
 
%package       module-mailaliases
Requires: 	server(smtp)
Summary:  MailAliases module for openATTIC
 
%description module-mailaliases
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 Mail Transfer Agents use a file named /etc/aliases in order to configure
 mail redirection for certain users. This package contains an openATTIC module
 which automatically alters this file to match the users configured in the
 openATTIC database.
 
%package       module-mdraid
Requires: mdadm
Summary:  MDRAID module for openATTIC
 
%description module-mdraid
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 This package includes support for MD-RAID, the common Linux software RAID.
 
%package       module-nagios
Requires:	nagios 
Requires:	nagios-plugins-all 
Requires:	pnp4nagios
Summary:  Nagios module for openATTIC
 
%description module-nagios
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 Nagios is a widely used system monitoring solution. This package installs a
 module which automatically configures service checks for your configured
 volumes and shares, measures performance data, and provides you with an
 intuitive user interface to view the graphs.
 .
 This package also contains the Nagios check plugins for openATTIC, namely:
  * check_diskstats
  * check_iface_traffic
  * check_openattic_systemd
  * check_openattic_rpcd
 
%package       module-nfs
Requires:	nfs-utils 
Summary:  NFS module for openATTIC
 
%description module-nfs
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 Network File System is the most widely used mechanism for sharing files
 between UNIX hosts. This package installs a module that allows Volumes to
 be shared using NFS, which is the recommended way not only for UNIXes, but
 also for VMware ESX virtualization hosts.
 
%package       module-samba
Requires:	samba
Summary:  Samba module for openATTIC
 
%description module-samba
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 Samba implements the SMB/CIFS protocol and enables file sharing with hosts
 that run the Microsoft Windows family of operating systems. This package
 provides configuration facilities for Samba Shares.
 
%package       module-tftp
Requires:	tftp-server
Summary:  TFTP module for openATTIC
 
%description module-tftp
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 Trivial FTP is an extremely simple File Transfer Protocol often used in
 situations where the standard FTP protocol causes too much overhead. This
 situation is typically encountered when booting systems over the network,
 or transferring configurations for routers and switches.
 .
 This package installs a module which allows you to configure TFTP services
 through openATTIC.
 
%package       module-twraid
# TODO: List Requirements
Summary:  3ware RAID module for openATTIC
 
%description module-twraid
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 This package installs a module that allows administration of 3ware RAID
 controllers through openATTIC.
 
%package       module-zfs
Requires:	zfs 
Requires:	kernel-devel 
Summary:  ZFS module for openATTIC
 
%description module-zfs
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 This package includes support for ZFS, a pooled file system designed for
 maximum data integrity, supporting data snapshots, multiple copies, and data
 checksums. It depends on zfsonlinux, the native Linux port of ZFS.
 
%package       pgsql
Requires:       postgresql 
Requires:	postgresql-server
Requires:	openattic-base
Summary:  PGSQL database for openATTIC
 
%description pgsql
 openATTIC is a storage management system based upon Open Source tools with
 a comprehensive user interface that allows you to create, share and backup
 storage space on demand.
 .
 This package configures the PostgreSQL database for openATTIC.
 
%prep

rm -rf openattic
hg clone %{hgrepo}
cd openattic
#hg archive -t tbz2 %{_sourcedir}/%{name}_%{version}.tar.bz2 -X ".hg*"
hg archive -t tbz2 %{_sourcedir}/%{name}.tar.bz2 -X ".hg*"
cd ..
rm -rf openattic/.hg*
rm -rf openattic/pkgapt


%build


%install

echo "==================="
mkdir -p ${RPM_BUILD_ROOT}/usr/share/
rsync -avPAX openattic ${RPM_BUILD_ROOT}/usr/share/
echo "==================="

mkdir -p ${RPM_BUILD_ROOT}%{_defaultdocdir}/%{name}-%{version}

mv ${RPM_BUILD_ROOT}/usr/share/openattic/CHANGELOG %{_builddir}
mv ${RPM_BUILD_ROOT}/usr/share/openattic/LICENSE   %{_builddir}
mv ${RPM_BUILD_ROOT}/usr/share/openattic/README.rst   %{_builddir}

cd ${RPM_BUILD_ROOT}
mkdir -p ${RPM_BUILD_ROOT}/usr/share
mkdir -p ${RPM_BUILD_ROOT}%{_bindir}
mkdir -p ${RPM_BUILD_ROOT}%{_sbindir}
mkdir -p ${RPM_BUILD_ROOT}/var/lib/openattic/http/volumes
mkdir -p ${RPM_BUILD_ROOT}/var/lib/openattic/nfs_dummy
mkdir -p ${RPM_BUILD_ROOT}/var/lib/openattic/static
mkdir -p ${RPM_BUILD_ROOT}/var/lock/openattic

cd ${RPM_BUILD_ROOT}/usr/share

cd ${RPM_BUILD_ROOT}/usr/bin
ln -s /usr/share/openattic/bin/oacli .
cd ${RPM_BUILD_ROOT}/usr/sbin
ln -s /usr/share/openattic/bin/blkdevzero .
ln -s /usr/share/openattic/bin/oaconfig .

rm -f ${RPM_BUILD_ROOT}/usr/share/openattic/installed_apps.d/50_pkgapt
sed -i -e 's/^ANGULAR_LOGIN.*$/ANGULAR_LOGIN = False/g' ${RPM_BUILD_ROOT}/usr/share/openattic/settings.py

# Configure /etc/default/openattic
mkdir -p ${RPM_BUILD_ROOT}/etc/default/
cat > ${RPM_BUILD_ROOT}/etc/default/openattic <<EOF
PYTHON="/usr/bin/python"
OADIR="/usr/share/openattic"

RPCD_PIDFILE="/var/run/openattic_rpcd.pid"
RPCD_CHUID="openattic:openattic"
RPCD_LOGFILE="/var/log/openattic_rpcd"
RPCD_LOGLEVEL="INFO"
RPCD_OPTIONS="$OADIR/manage.py runrpcd"
RPCD_CERTFILE=""
RPCD_KEYFILE=""

SYSD_PIDFILE="/var/run/openattic_systemd.pid"
SYSD_LOGFILE="/var/log/openattic_systemd"
SYSD_LOGLEVEL="INFO"
SYSD_OPTIONS="$OADIR/manage.py runsystemd"

WEBSERVER_SERVICE="httpd"
SAMBA_SERVICES="smb nmb"
WINBIND_SERVICE="winbind"

NAGIOS_CFG="/etc/nagios/nagios.cfg"
NAGIOS_STATUS_DAT="/var/log/nagios/status.dat"
NAGIOS_SERVICE="nagios"
NPCD_MOD="/usr/lib64/nagios/brokers/npcdmod.o"
NPCD_CFG="/etc/pnp4nagios/npcd.cfg"
NPCD_SERVICE="npcd"
EOF

# database config
## TODO: generate random password

mkdir -p   ${RPM_BUILD_ROOT}/etc/openattic/databases
cat <<EOF > ${RPM_BUILD_ROOT}/etc/openattic/databases/pgsql.ini
[default]
engine   = django.db.backends.postgresql_psycopg2
name     = openattic
user     = openattic
password = ip32...beg
host     = localhost
port     =
EOF

ln -s /etc/openattic/databases/pgsql.ini ${RPM_BUILD_ROOT}/etc/openattic/database.ini

# configure dbus
mkdir -p  ${RPM_BUILD_ROOT}/etc/dbus-1/system.d/
cat <<EOF >  ${RPM_BUILD_ROOT}/etc/dbus-1/system.d/openattic.conf
<!DOCTYPE busconfig PUBLIC
    "-//freedesktop//DTD D-BUS Bus Configuration 1.0//EN"
    "http://www.freedesktop.org/standards/dbus/1.0/busconfig.dtd">
<busconfig>
    <policy user="root">
            <allow own="org.openattic.systemd" />
            <allow send_destination="org.openattic.systemd" />
            <allow receive_sender="org.openattic.systemd"   />
    </policy>
    <policy user="openattic">
            <allow send_destination="org.openattic.systemd" />
            <allow receive_sender="org.openattic.systemd"   />
    </policy>
    <policy user="nagios">
            <allow send_destination="org.openattic.systemd" />
            <allow receive_sender="org.openattic.systemd"   />
    </policy>
    <policy context="default">
            <deny  send_destination="org.openattic.systemd" />
            <deny  receive_sender="org.openattic.systemd"   />
    </policy>
</busconfig>
EOF

#configure nagios
mkdir -p  ${RPM_BUILD_ROOT}/etc/nagios/conf.d/
cat <<EOF > ${RPM_BUILD_ROOT}/etc/nagios/conf.d/openattic_plugins.cfg
define command{
    command_name check_openattic_systemd
    command_line $USER1$/check_openattic_systemd
}

define command{
    command_name check_openattic_rpcd
    command_line $USER1$/check_openattic_rpcd
}

define command{
    command_name check_iface_traffic
    command_line $USER1$/check_iface_traffic $ARG1$
}

define command{
    command_name check_diskstats
    command_line $USER1$/check_diskstats $ARG1$
}

define command{
    command_name check_volume_utilization
    command_line $USER1$/check_oa_utilization $ARG1$
}

define command{
    command_name check_pool_utilization
    command_line $USER1$/check_oa_utilization -p $ARG1$
}

define command{
    command_name check_protocol_traffic
    command_line $USER1$/check_protocol_traffic -i $ARG1$
}

define command{
    command_name check_lvm_snapshot
    command_line $USER1$/check_lvm_snapshot $ARG1$
}

define command{
    command_name check_cputime
    command_line $USER1$/check_cputime -c $ARG1$
}

define command{
    command_name check_twraid_unit
    command_line $USER1$/check_twraid_unit $ARG1$
}

define command{
    command_name notify_openattic
    command_line $USER1$/notify_openattic
}
EOF

mkdir -p  ${RPM_BUILD_ROOT}/usr/lib64/nagios/plugins/
cd  ${RPM_BUILD_ROOT}/usr/lib64/nagios/plugins/
ln -s ../../../share/openattic/nagios/plugins/* .

mkdir -p ${RPM_BUILD_ROOT}/lib/systemd/system/
cd ${RPM_BUILD_ROOT}/lib/systemd/system/
ln -s /usr/share/openattic/etc/systemd/openattic-rpcd.service openattic-rpcd.service
ln -s /usr/share/openattic/etc/systemd/openattic-systemd.service openattic-systemd.service


# Openattic httpd config
mkdir -p ${RPM_BUILD_ROOT}/etc/httpd/conf.d/
cat <<EOF >${RPM_BUILD_ROOT}/etc/httpd/conf.d/openattic.conf
<IfModule mod_wsgi.c>

Alias                   /openattic/static/extjs_themes/images/default/ /usr/share/javascript/extjs/resources/images/default/
Alias                   /openattic/static/extjs/  /srv/ext-4.2.1.883/
Alias                   /openattic/static/oxygen/ /usr/share/icons/oxygen/
Alias                   /openattic/static/admin/  /usr/share/pyshared/django/contrib/admin/static/admin/
Alias                   /openattic/static/        /usr/share/openattic/htdocs/
Alias                   /openattic/angular/       /usr/share/openattic-gui/dist/
Alias                   /openattic/staticfiles/   /var/lib/openattic/static/

WSGIScriptAlias         /openattic                /usr/share/openattic/openattic.wsgi
WSGIDaemonProcess       openattic threads=25 user=openattic group=openattic
WSGIProcessGroup        openattic
WSGIScriptReloading     Off
WSGIPassAuthorization   On

<Directory /usr/share/openattic>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
</Directory>

<Directory /var/lib/openattic>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
</Directory>

<Directory /usr/share/openattic/htdocs>
        <IfModule mod_headers.c>
                <FilesMatch "\.(ico|pdf|flv|jpg|jpeg|png|gif|js|css|swf)$">
                        Header set Cache-Control "max-age=86400, must-revalidate"
                </FilesMatch>
        </IfModule>
</Directory>

<Directory /usr/share/icons/oxygen>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
</Directory>

<Directory /srv/ext-4.2.1.883>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
</Directory>

<Location /openattic>
        Allow from all
        FileETag None
        <IfModule mod_deflate.c>
                AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript image/png image/jpeg image/gif
                <IfModule mod_headers.c>
                        # properly handle requests coming from behind proxies
                        Header unset ETag
                        Header append Vary User-Agent
                </IfModule>
        </IfModule>
</Location>

# Enable this after you joined openAttic into the domain.
#<Location /openattic/accounts/kerblogin.js>
#    AuthType Kerberos
#    KrbServiceName HTTP/13-19.master.dns@MASTER.DNS
#    KrbAuthRealms MASTER.DNS
#    Krb5Keytab /etc/krb5.keytab
#    KrbMethodNegotiate on
#    KrbMethodK5Passwd off
#    KrbLocalUserMapping on
#    Require valid-user
#</Location>
</IfModule>
EOF



%pre
# create openattic user/group  if it does not exist
if id -g openattic >/dev/null 2>&1; then
        echo "openattic group exists"
else
        groupadd openattic &&  echo "openattic group created"
fi
if id -u openattic >/dev/null 2>&1; then
        echo "openattic user exists"
else
	adduser --system --shell /bin/bash  --home /var/lib/openattic --gid openattic openattic &&\
	groupmems -g openattic  -a apache &&\
	groupmems -a openattic  -g apache &&\
	groupmems -a openattic  -g nagios &&\
	echo "openattic user created"
	groupmems -g openattic  -a nagios
fi
# for double security only, should be installed correctly
chown -R openattic:openattic /var/lock/openattic
chown -R openattic:openattic /var/lib/openattic

# Sollte im Paket erledigt sein, aber wird zur Sicherheit noch angelegt
touch /var/log/openattic_rpcd
chown openattic:openattic /var/log/openattic_rpcd
chmod 644 /var/log/openattic_rpcd
touch /var/log/openattic_systemd
chown openattic:openattic /var/log/openattic_systemd
chmod 644 /var/log/openattic_systemd

%post base
systemctl restart  dbus.service
systemctl daemon-reload

%postun base
systemctl restart  dbus.service
systemctl daemon-reload

%post pgsql

# Configure Postgres DB
systemctl start postgresql
if postgresql-setup initdb; then
	echo "postgresql database initialized";
else
	echo "postgres database already initialized";
fi
systemctl enable postgresql
systemctl start postgresql

#TODO: Dynamisches Passwort erzeugen und ausgeben
#pass=$(openssl rand -hex 10)
dbu=$(su - postgres -c "psql --list" | awk -F'|' ' /openattic/ { print $2 }')
echo "===> $dbu"
if [ -n "$dbu" ]; then
	echo "Database openattic exists, owned by $dbu"
else
su - postgres -c psql << EOT
create user openattic with password 'ip32...beg';
create database openattic with owner openattic;
\q
EOT
	#sed -i -e "s/ip32...beg/$pass/g" /etc/openattic/databases/pgsql.ini
	sed -i -e 's/ident$/md5/g' /var/lib/pgsql/data/pg_hba.conf 
fi
systemctl reload postgresql
systemctl status postgresql

%postun pgsql
# Datenbank drop
echo "You need to drop the openattic database & user"
echo "run the following commands as root"
echo ""
echo "su - postgres -c psql"
echo "postgres=# drop database openattic"
echo "postgres=# drop user openattic"
echo "postgres=# \q"
echo ""

%files 	
%defattr(-,root,root,-)
%doc CHANGELOG LICENSE README.rst

%files 	base
%defattr(-,root,root,-)
%{_bindir}/oacli
%{_sbindir}/blkdevzero
%{_sbindir}/oaconfig
%config /etc/dbus-1/system.d/openattic.conf
/lib/systemd/system/openattic-rpcd.service
/lib/systemd/system/openattic-systemd.service
%config /etc/httpd/conf.d/openattic.conf
%defattr(-,openattic,openattic,-)
%dir /var/lib/openattic
%dir /var/lock/openattic
%dir /usr/share/openattic/installed_apps.d
%config(noreplace) /etc/default/openattic
%config(noreplace) /etc/openattic/databases/pgsql.ini
/usr/share/openattic/.jslint.sh
/usr/share/openattic/.pylintrc
/usr/share/openattic/__init__.pyc
/usr/share/openattic/__init__.pyo
/usr/share/openattic/bin/
/usr/share/openattic/clustering/
/usr/share/openattic/installed_apps.d/70_clustering
/usr/share/openattic/etc/
/usr/share/openattic/manage.pyc
/usr/share/openattic/manage.pyo
/usr/share/openattic/oa_auth.pyc
/usr/share/openattic/oa_auth.pyo
/usr/share/openattic/pamauth.pyc
/usr/share/openattic/pamauth.pyo
/usr/share/openattic/processors.pyc
/usr/share/openattic/processors.pyo
/usr/share/openattic/settings.pyc
/usr/share/openattic/settings.pyo
/usr/share/openattic/urls.pyc
/usr/share/openattic/urls.pyo
/usr/share/openattic/views.pyc
/usr/share/openattic/views.pyo
/usr/share/openattic/peering/
/usr/share/openattic/__init__.py
/usr/share/openattic/rpcd/
/usr/share/openattic/locale/
/usr/share/openattic/rest/
/usr/share/openattic/templates/
/usr/share/openattic/volumes/
/usr/share/openattic/htdocs/
/usr/share/openattic/ifconfig/
/usr/share/openattic/systemd/
/usr/share/openattic/sysutils/
/usr/share/openattic/installed_apps.d/20_volumes
/usr/share/openattic/urls.py
/usr/share/openattic/openattic.wsgi
/usr/share/openattic/processors.py
/usr/share/openattic/cmdlog/
/usr/share/openattic/userprefs/
/usr/share/openattic/pamauth.py
/usr/share/openattic/manage.py
/usr/share/openattic/views.py
/usr/share/openattic/oa_auth.py
/usr/share/openattic/settings.py
/usr/share/openattic/docs/openattic-client.php

#./usr/share/man/
#./usr/share/man/man1/
#./usr/share/man/man1/oaconfig.1.gz
#./usr/share/man/man1/oacli.1.gz

%files 	module-btrfs
%defattr(-,openattic,openattic,-)
/usr/share/openattic/installed_apps.d/10_btrfs
/usr/share/openattic/btrfs/

%files 	module-cron
%defattr(-,openattic,openattic,-)
/usr/share/openattic/installed_apps.d/09_cron
/usr/share/openattic/cron/

%files 	module-drbd
%defattr(-,openattic,openattic,-)
/usr/share/openattic/drbd/
/usr/share/openattic/installed_apps.d/60_drbd

%files 	module-ftp
%defattr(-,openattic,openattic,-)
/usr/share/openattic/ftp/
/usr/share/openattic/installed_apps.d/60_ftp

%files 	module-http
%defattr(-,openattic,openattic,-)
/var/lib/openattic/http/
/usr/share/openattic/http/
/usr/share/openattic/installed_apps.d/60_http
%defattr(-,openattic,openattic,-)

%files 	module-ipmi
%defattr(-,openattic,openattic,-)
/usr/share/openattic/installed_apps.d/50_ipmi
/usr/share/openattic/ipmi/

%files 	module-lio
%defattr(-,openattic,openattic,-)
/usr/share/openattic/installed_apps.d/60_lio
/usr/share/openattic/lio/

%files 	module-lvm
%defattr(-,openattic,openattic,-)
/usr/share/openattic/lvm/
/usr/share/openattic/installed_apps.d/10_lvm

%files 	module-mailaliases
%defattr(-,openattic,openattic,-)
/usr/share/openattic/mailaliases/
/usr/share/openattic/installed_apps.d/50_mailaliases

%files 	module-mdraid
%defattr(-,openattic,openattic,-)
/usr/share/openattic/mdraid/
/usr/share/openattic/installed_apps.d/09_mdraid

%files 	module-nagios
#/etc/pnp4nagios/check_commands/check_diskstats.cfg
#/etc/pnp4nagios/check_commands/check_all_disks.cfg
#/etc/nagios-plugins/config/openattic.cfg
#/etc/nagios/conf.d/openattic_static.cfg
%defattr(-,root,root,-)
%config /etc/nagios/conf.d/openattic_plugins.cfg
/usr/lib64/nagios/plugins/check_cputime
/usr/lib64/nagios/plugins/check_diskstats
/usr/lib64/nagios/plugins/check_drbd
/usr/lib64/nagios/plugins/check_drbdstats
/usr/lib64/nagios/plugins/check_iface_traffic
/usr/lib64/nagios/plugins/check_lvm_snapshot
/usr/lib64/nagios/plugins/check_oa_utilization
/usr/lib64/nagios/plugins/check_openattic_rpcd
/usr/lib64/nagios/plugins/check_openattic_systemd
/usr/lib64/nagios/plugins/check_protocol_traffic
/usr/lib64/nagios/plugins/check_twraid_unit
/usr/lib64/nagios/plugins/notify_openattic
%defattr(-,openattic,openattic,-)
/usr/share/openattic/installed_apps.d/50_nagios
/usr/share/openattic/nagios

%files 	module-nfs
%defattr(-,openattic,openattic,-)
/var/lib/openattic/nfs_dummy/
/usr/share/openattic/installed_apps.d/60_nfs
/usr/share/openattic/nfs/

%files 	module-samba
%defattr(-,openattic,openattic,-)
/usr/share/openattic/installed_apps.d/60_samba
/usr/share/openattic/samba/

%files 	module-tftp
%defattr(-,openattic,openattic,-)
/usr/share/openattic/installed_apps.d/60_tftp
/usr/share/openattic/tftp/

%files 	module-twraid
%defattr(-,openattic,openattic,-)
/usr/share/openattic/installed_apps.d/09_twraid
/usr/share/openattic/twraid/
#./etc/
#./etc/cron.d/
#./etc/cron.d/updatetwraid

%files 	module-zfs
%defattr(-,openattic,openattic,-)
/usr/share/openattic/installed_apps.d/30_zfs
/usr/share/openattic/zfs/

%files 	pgsql
%defattr(-,openattic,openattic,-)
/etc/openattic/


%changelog
* Tue Feb 24 2015 Markus Koch  <mkoch@redhat.com> - 1.2 build 
- split into package modules
* Fri May 23 2003 Markus Koch  <mkoch@redhat.com> - 1.2 build version 1
- First build.
