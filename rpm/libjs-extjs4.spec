Name:		libjs-extjs4
Version:	4.2.1
Release:	1%{?dist}
Summary:	Openattic libjs

Group:		System Environment/Libraries
License:	GPLv2	
URL:		https://www.openattic.org
BuildArch:      noarch

Source:		http://apt.open-attic.org/pool/main/libj/libjs-extjs4/libjs-extjs4_4.2.1.orig.tar.bz2

BuildRequires:	wget
Requires: policycoreutils-python

%description
openATTIC is a storage management system based upon Open Source tools with
a comprehensive user interface that allows you to create, share and backup
storage space on demand.
.
libjs-extjs is a supporting gui library

%prep
%setup -n ext-4.2.1.883


%build


%install
mkdir -p ${RPM_BUILD_ROOT}/srv/ext-4.2.1.883/
rsync -avPAX . ${RPM_BUILD_ROOT}/srv/ext-4.2.1.883/
chown -R apache:apache ${RPM_BUILD_ROOT}/srv/ext-4.2.1.883/

%post
semanage fcontext -a -t httpd_sys_rw_content_t "/srv/ext-4.2.1.883(/.*)?"
restorecon -vvR /srv

%postun
semanage fcontext -d -t httpd_sys_rw_content_t "/srv/ext-4.2.1.883(/.*)?"

%files
%defattr(-,openattic,openattic,-)
/srv/ext-4.2.1.883


%changelog
* Tue Mar 03 2015 Markus Koch  <mkoch@redhat.com> - 4.2.1.883
- First build.


