.. _ui_customizing:

Customizing the |oA| WebUI
==========================

The |oA| user interface is a web application based on the `AngularJS 1
<https://angularjs.org/>`_ JavaScript MVW framework the `Bootstrap
<http://getbootstrap.com/>`_ framework. Using Cascading Style Sheets (CSS), it is
possible to customize the look to some degree, e.g. by replacing the logo or
adapting the color scheme.

These modifications can be performed by adding your changes to the
``vendor.css`` CSS file. It is located in the directory
``webui/app/styles/vendor.css`` in the Mercurial source code repository and the
source tar archive, or in ``/usr/share/openattic-gui/styles/vendor.css`` in the
RPM and DEB packages.

Take a look at the file `webui/app/styles/openattic-theme.css <https://bitbucket.
org/openattic/openattic/src/default/webui/app/styles/openattic-theme.css>`_ to get
an overview about the existing class names and their attributes.

Alternatively, you can use `Mozilla Firebug <http://getfirebug.com/>`_ or
similar web development tools to obtain this information.

Changing the favicon
--------------------

An alternative favicon image (PNG format, 32x32 pixels) must be copied to the
``images/`` directory (``webui/app/images`` in the source,
``/usr/share/openattic-gui/images`` for the installation packages).

If you choose a different name for the image file, the file name in
``index.html`` must be adapted. As of the time of writing, this information is
located in lines 27-29::

  <!-- favicons -->
  <link rel="shortcut icon" href="images/openattic_favicon_32x32.png" type="image/x-icon">
  <link rel="icon" href="images/openattic_favicon_32x32.png" type="image/x-icon">

Changing the logo
-----------------

It is possible to customize the application logo displayed in the top left
corner of the application window. The format should be PNG, the size should not
exceed 250x25 pixel (to ensure it is displayed properly on mobile devices).

The logo file should be copied into the ``images/`` directory. If you choose a
different name than the default, update the file name in file
``components/navigation/navigation.view.html`` (currently located in line 5).

If you comment out line 5 and enable line 6, the graphical logo can be replaced
with regular text::

  <a class="navbar-brand" href="#"><img src="images/openattic_brand_bright.png" alt="openATTIC"></a>
  <!--<a class="navbar-brand" href="#">openATTIC storage management framework</a>-->

In addition, the logo on the login screen should to be replaced to match your
desired logo. It should be in PNG format and should not exceed 256x256 px. This
can be achieved by changing the image file name in file
``templates/login.html``, line 4::

  <img src="images/openattic_favicon_256x256.png" alt="openATTIC" class="pull-right">