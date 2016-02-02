Administration Guide
====================

.. _admin_auth_methods:

Authentication
--------------

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

Introducting the New Graphical User Interface
---------------------------------------------

The new user interface is now based on Bootstrap to make it look more modern,
realizing this was a great advantage when we switched from the `ExtJS
<https://www.sencha.com/products/extjs/>`_ to the `AngularJS
<https://angularjs.org/>`_ JavaScript framework.

We restructured the |oA| user interface in order to make it more intuitive and
user-friendly. This included a clean-up of the menu tree as well. Actions like
snapshots and shares are now directly available in the volumes panel - by
selecting a volume those options get activated and will only display useful
actions, depending on the volume type.

Also, we have integrated wizards on the dashboard so that users can be guided
through the single steps based on specific use cases like **VM storage** or
**Raw Block Storage**.

.. todo:: add screenshots for each panel / form screenshots

How to Perform Common Tasks
===========================

.. todo:: For further documentation:

* Dashboard

  * overview of the system (disk load, cpu load)
  * cluster/host status (written data, network traffic)
  * wizards

* Disks

  * displays all disks
  * create pool

* Pools

  * all existing pools
  * add pool

* Volumes

  * volumes overview
  * actions

    * add
    * delete
    * set deletion protection for volume
    * clone
    * resize

  * more options (detail-view)

    * click volume and

       * make a snapshot
       * create clone from snapshot
       * create a share
       * automatically only shows available options for volume type

    * without filesystem

      * only iSCSI/FibreChannel

    * with filesystem

      * http
      * NFS
      * CIFS
      * check performance

* Hosts

  * host overview
  * actions

    * add

      * add attribute (peer, initiator for iSCSI share/FibreChannel WWN for FC share)

* System

  * Users

    * add
    * edit
    * delete
    * update: field "is superuser" was changed to "has all privileges" | "is staff" was changed to "is administrator"

  * Command Logs

    * all nagios logs
    * options

      * delete by date
      * delete

  * CRUSH Map

Removed: API-Keys
