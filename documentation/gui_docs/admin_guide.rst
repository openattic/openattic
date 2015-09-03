Administrator guide
===================

The new graphical user interface of openATTIC
---------------------------------------------

The new user interface is now based on bootstrap to make it look more modern -
realizing this was a great advantage when we switched from
JavaScript framework ``ExtJS`` to ``AngularJS``.
.. TODO add AngularJS link

We restructured the openATTIC menu in order to make it more intuitive and user-friendly.
This included a clean-up of the menu tree as well.
Actions like snapshots and shares are now directly available in
the volumes panel - by selecting a volume those options get activated
and will only display useful actions, depending on the volume type.

Also, we have integrated wizards on the dashboard so that users can be guided through the single steps
based on specific use cases like ``VM storage`` or ``Raw Block Storage``.


.. TODO add screenshots for each panel / form screenshots


How to perform common tasks
===========================

.. For further documentation:

* Dashboard
 - overview of the system (disk load, cpu load)
 - cluster/host status (written data, network traffic)
 - wizards

* Disks
 - displays all disks
  - create pool

* Pools
 - all existing pools
 - add pool

* Volumes
 - volumes overview
  - actions:
   - add
   - delete
   - set deletion protection for volume
   - clone
   - resize

   - more options (detail-view):
    - click volume and:
       - make a snapshot
         - create clone from snapshot
       - create a share
         - automatically only shows available options for volume type
	  - without filesystem:
	    - only iSCSI/FibreChannel
	  - with filesystem:
	    - http
	    - nfs
	    - cifs
       - check performance
       -
* Hosts
 - host overview
 - actions:
   - add
     - add attribute (peer, initiator for iSCSI share/FibreChannel WWN for FC share)

* System
 * Users
   * add
   * edit
   * delete
   * update: field "is superuser" was changed to "has all privileges" | "is staff" was changed to "is administrator"

* Command Logs
  * all nagios logs
  * options:
    * delete by date
    * delete
 * CRUSH Map


Removed: API-Keys

