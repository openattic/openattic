Name:		openattic-gui
Version:	0.0.2
Release:	1%{?dist}
Summary:	New Openattic User Interface	

Group:		System Environment/Libraries
License:	GPLv2
URL:		http://apt.open-attic.org/pool/main/o/openattic-gui/openattic-gui_0.0.2.orig.tar.bz2
BuildArch:      noarch

Source0:	http://apt.open-attic.org/pool/main/o/openattic-gui/openattic-gui_0.0.2.orig.tar.bz2

#BuildRequires:	npm
BuildRequires: 	git
Requires:	openattic


%description
openATTIC is a storage management system based upon Open Source tools with
a comprehensive user interface that allows you to create, share and backup
storage space on demand.
.
This is the new GUI

%prep
echo "===>" %{_sourcedir}
%setup -q -n %{name}_%{version}.orig


%build
# need to switch to the correct directory 
# 
pwd

which bower || npm install -g bower
which grunt || npm install -g grunt-cli
npm install
bower --allow-root install
grunt build

# Now the directory <%_builddir>/dist exists and contains the new gui


%install
# copy the dist directory
mkdir -p ${RPM_BUILD_ROOT}/usr/share/openattic-gui
cd dist
rsync -avPAX . ${RPM_BUILD_ROOT}/usr/share/openattic-gui/

# update http-config files /etc/httpd/conf.d/openattic-gui.conf
mkdir -p ${RPM_BUILD_ROOT}/etc/httpd/conf.d/
cat > ${RPM_BUILD_ROOT}/etc/httpd/conf.d/openattic-gui.conf << EOT
<IfModule mod_wsgi.c>
<Directory /usr/share/openattic-gui>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
</Directory>

Alias /openattic/angular/ /usr/share/openattic-gui/
</IfModule>
EOT

%pre

%post
semanage fcontext -a -t httpd_sys_rw_content_t "/usr/share/openattic-gui(/.*)?"
restorecon -vvR
oaconfig reload

# TODO: Sauberes %postun
# semanage fcontext -d -t httpd_sys_rw_content_t "/usr/share/openattic-gui(/.*)?"
# pip uninstall djangorestframework-bulk

%files
%defattr(-,openattic,openattic,-)
/usr/share/openattic-gui
%defattr(-,root,root,-)
%config /etc/httpd/conf.d/openattic-gui.conf


%changelog
* Thu Mar 26 2015 Markus Koch  <mkoch@redhat.com> - 0.2 build version 1
- First build.

