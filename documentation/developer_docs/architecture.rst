.. _developer_docs_architecture:

|oA| Architecture
=================

The |oA| core makes heavy use of the `Django framework
<http://djangoproject.com>`_ and is implemented as a Django project,
consisting of several apps, one for each supported functionality or backend
system.

Each app bundles a set of submodules. Models are used to represent the
structure of the objects an app is supposed to be able to manage. The REST API
(based on the `Django REST Framework <http://www.django-rest-framework.org/>`_
is used for interaction with the models. And lastly, the System API can be
used in order to run other programs on the system in a controlled way.

When an application (e.g. the |oA| Web UI, a command line tool or an external
application), wants to perform an action, the following happens:

* The REST API receives a request in form of a function call, decides which
  host is responsible for answering the request, and forwards it to the core
  on that host.

* The :ref:`developer_docs_architecture` consists of two layers:

  * Django Models, the brains. They keep an eye on the whole system and decide
    what needs to be done.
  * File system layer: Decides which programs need to be called in order to
    implement the actions requested by the models, and calls those programs
    via the |oA| ``systemd`` background process (not to be confused with the
    Linux operating system's `systemd System and Service Manager
    <http://www.freedesktop.org/wiki/Software/systemd/>`_).

* The |oA| ``systemd`` executes commands on the system and delivers the results.

Models
------

Models are used to provide an abstraction for the real-world objects that your
app has to cope with. They are responsible for database communication and for
keeping an eye on the state of the whole system, being able to access any other
piece of information necessary.

Please check out
`Django at a glance <https://docs.djangoproject.com/en/1.7/intro/overview/>`_
for more information.

|oA| systemd background process
-------------------------------

Some tasks require root privileges for being performed. In |oA|, this is done
via a separate background process ``openattic-systemd``, written in Python. The
Django web application uses ``DBUS`` as a bidirectional communication channel
to this background service.
