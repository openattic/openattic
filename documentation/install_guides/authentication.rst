.. _admin_auth_methods:

Configuring Authentication and Single Sign-On
=============================================

When logging in, each user passes through two phases: **Authentication** and
**Authorization**. The authentication phase employs mechanisms to ensure the
users are who they say they are. The authorization phase then checks if that
user is allowed access.

"Authentication is the mechanism of associating an incoming request with a set
of identifying credentials, such as the user the request came from, or the
token that it was signed with (Tom Christie)."

The |oA| authentication is based on the Django REST framework authentication
methods.

Currently |oA| supports the following authentication methods of the Django REST
framework:

* BasicAuthentication
* TokenAuthentication
* SessionAuthentication

Read more about the Django REST framework authentication methods here:
`Django REST framework - Authentication
<https://tomchristie.github.io/rest-framework-2-docs/api-guide/authentication>`_

Authentication
--------------

|oA| supports three authentication providers:

#.  Its internal database. If a user is known to the database and they entered
    their password correctly, authentication is passed.

#.  Using `Pluggable Authentication Modules
    <http://en.wikipedia.org/wiki/Pluggable_Authentication_Modules>`_ to
    delegate authentication of username and password to the Linux operating
    system. If PAM accepts the credentials, a database user without any
    permissions is created and authentication is passed.

#.  Using Kerberos tickets via `mod_auth_kerb
    <http://modauthkerb.sourceforge.net/>`_.  Apache will verify the Kerberos
    ticket and tell |oA| the username the ticket is valid for, if any.
    |oA| will then create a database user without any permissions and
    pass authentication.

Authorization
-------------

Once users have been authenticated, the authorization phase makes sure that
users are only granted access to the |oA| GUI if they posess the
necessary permissions.

Authorization is always checked against the |oA| user database. In order
to pass authorization, a user account must be marked active and a staff
member.

Users created by the PAM and Kerberos authentication backends will
automatically be marked active, but will not be staff members. Otherwise,
*every* user in your domain would automatically gain access to |oA|,
which is usually not desired.

However, usually there is a distinct group of users which are designated
|oA| administrators and therefore should be allowed to access all
|oA| systems, without needing to be configured on every single one.

In order to achieve that, |oA| allows the name of a system group to be
configured.  During the authorization phase, if a user is active but not a
staff member, |oA| will then check if the user is a member of the
configured user group, and if so, make them a staff member automatically.


.. _install_kerberos:


Configuring Domain Authentication and Single Sign-On
----------------------------------------------------

To configure authentication via a domain and to use Single Sign-On via
Kerberos, a few steps are required.

#. Configuring |oA|

   As part of the domain join process, the ``oaconfig`` script creates a file
   named ``/etc/openattic/domain.ini`` which contains all the relevant
   settings in Python's `ConfigParser
   <https://docs.python.org/2/library/configparser.html>`_ format.

   The ``[domain]`` section contains the kerberos ``realm`` and Windows
   ``workgroup`` name.

   The ``[pam]`` section allows you to enable password-based domain account
   authentication, and allows you to change the name of the PAM service to be
   queried using the ``service`` parameter. Note that by default, the PAM
   backend changes user names to upper case before passing them on to PAM --
   change the ``is_kerberos`` parameter to ``no`` if this is not desired.

   Likewise, the ``[kerberos]`` section allows you to enable ticket-based
   domain account authentication.

   In order to make use of the domain group membership check, add a section
   named ``[authz]`` and set the ``group`` parameter to the name of your group
   in lower case, like so::

      [authz]
      group = yourgroup

   To verify the group name, you can try the following on the shell::

      $ getent group yourgroup
      yourgroup:x:30174:user1,user2,user3

#. Configuring Apache

   Please take a look at the |oA| configuration file
   (``/etc/apache2/conf.d/openattic`` on Debian/Ubuntu). At the bottom, this
   file contains a configuration section for Kerberos. Uncomment the section,
   and adapt the settings to your domain.

   In order to activate the new configuration, run::

      apt-get install libapache2-mod-auth-kerb
      a2enmod auth_kerb
      a2enmod authnz_ldap
      service apache2 restart

#.  Logging in with Internet Explorer should work already. Mozilla Firefox
    requires you to configure the name of the domain in ``about:config`` under
    ``network.negotiate-auth.trusted-uris``.

Troubleshooting Authentication Issues
-------------------------------------

Kerberos and LDAP are complex technologies, so it's likely that some errors
occur.

Before proceeding, please double-check that NTP is installed and configured
and make sure that ``hostname --fqdn`` returns a fully qualified domain name
as outlined in the installation instructions.

Below is a list of common error messages and their usual meanings.

*   ``Client not found in Kerberos database while getting initial credentials``

    Possible reason: The KDC doesn't know the service (i.e., your domain join
    failed).

*   ``Generic preauthentication failure while getting initial credentials``

    Possible reason: ``/etc/krb5.keytab`` is outdated. Update it using the
    following commands::

      net ads keytab flush
      net ads keytab create
      net ads keytab add HTTP

*   ``gss_acquire_cred() failed: Unspecified GSS failure. Minor code may provide
    more information (, )``

    Possible reason: Apache is not allowed to read ``/etc/krb5.keytab``, or
    wrong ``KrbServiceName`` in ``/etc/apache2/conf.d/openattic``.
