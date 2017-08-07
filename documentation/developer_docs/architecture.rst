.. _developer_docs_models:

|oA| Core
=========

The |oA| core makes heavy use of the `Django framework
<http://djangoproject.com>`_ and is implemented as a Django project,
consisting of several apps, one for each supported functionality or backend
system.

Each app bundles a set of submodules. Models are used to represent the
structure of the objects an app is supposed to be able to manage. The REST API
(based on the `Django REST Framwork <http://www.django-rest-framework.org/>`_
is used for interaction with the models. And lastly, the System API can be
used in order to run other programs on the system in a controlled way.

Models
------

Models are used to provide an abstraction for the real-world objects that your
app has to cope with. They are responsible for database communication and for
keeping an eye on the state of the whole system, being able to access any other
piece of information necessary.

Please check out
`Django at a glance <https://docs.djangoproject.com/en/1.7/intro/overview/>`_
for more information.

Filesystem API
--------------

The filesystem API abstracts handling different file systems, translates actions
initiated by the model into commands to be executed and calls Systemd accordingly.
