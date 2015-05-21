Name:		openattic-gui
Version:        %{BUILDVERSION}
Release:        %{PKGVERSION}%{?dist}
Summary:	New Openattic User Interface	

Group:		System Environment/Libraries
License:	GPLv2
URL:		http://apt.open-attic.org/pool/main/o/openattic-gui/openattic-gui_0.0.2.orig.tar.bz2
BuildArch:      noarch

BuildRequires:	git
Requires:	openattic


%description
openATTIC is a storage management system based upon Open Source tools with
a comprehensive user interface that allows you to create, share and backup
storage space on demand.
.
This is the new GUI

%prep


%build
cd openattic-gui
which bower || npm install -g bower
which grunt || npm install -g grunt-cli
npm install
bower --allow-root install
grunt build

%install
# copy the dist directory
mkdir -p ${RPM_BUILD_ROOT}/usr/share/openattic-gui
rsync -aAX openattic-gui/dist/ ${RPM_BUILD_ROOT}/usr/share/openattic-gui/

# update http-config files /etc/httpd/conf.d/openattic-gui.conf
mkdir -p ${RPM_BUILD_ROOT}/etc/httpd/conf.d/
cat > ${RPM_BUILD_ROOT}/etc/httpd/conf.d/openattic-gui.conf << EOT
Alias /openattic/angular/ /usr/share/openattic-gui/

<Directory /usr/share/openattic-gui>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
</Directory>
EOT

%pre

%post
semanage fcontext -a -t httpd_sys_rw_content_t "/usr/share/openattic-gui(/.*)?"
restorecon -vvR
service httpd reload

%postun
semanage fcontext -d -t httpd_sys_rw_content_t "/usr/share/openattic-gui(/.*)?"
restorecon -vvR
service httpd reload

%files
%defattr(-,openattic,openattic,-)
/usr/share/openattic-gui
%defattr(-,root,root,-)
%config /etc/httpd/conf.d/openattic-gui.conf


%changelog
* Thu May 21 2015 Michael Ziegler <michael@open-attic.org> - %{BUILDVERSION}-%{PKGVERSION}
- Remove prep stuff
- Replace fixed version numbers by BUILDVERSION and PKGVERSION macros which are populated with info from HG
- Remove Source0 which is no longer valid anyway
- Clean up apache configuration
- Cleanup postinst
- Add postun

* Thu Mar 26 2015 Markus Koch  <mkoch@redhat.com> - 0.2 build version 1
- First build.

