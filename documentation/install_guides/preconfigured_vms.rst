.. _download preconfigured virtual machine:

Download Preconfigured Virtual Machine
======================================

|oA| can be downloaded as preconfigured virtual machines from http://download.openattic.org/vms/.

At the moment you can download |oA| installed on Debian and Ubuntu. More coming soon...

You can choose between two different image files - **qcow2 for KVM** and **vdi for VirtualBox**.

The default login username for the VMs is **root** and the password is **openattic**. 

The default login username for the |oA| WebUI is **openattic** and the password is **openattic**.

	.. note::

	Please run **oaconfig install** the first time you've started the virtual machine. 
	Otherwise the WebUI will be empty.

How to use those images:

#.	KVM - Libvirt XML example file - you can use this example and import it to libvirt if you want to.
	Revise disk path and bridge name according to your needs. 
	Otherwise create a new vm and select the image file as your disk::
	
	<domain type='kvm'>
	  <name>oa-vm-deb</name>
	  <uuid>e8afb480-d464-ed28-c200-000000000002</uuid>
	  <memory unit='KiB'>2097152</memory>
	  <currentMemory unit='KiB'>2097152</currentMemory>
	  <vcpu placement='static'>2</vcpu>
	  <resource>
	    <partition>/machine</partition>
	  </resource>
	  <os>
	    <type arch='x86_64' machine='pc-1.0'>hvm</type>
	    <boot dev='hd'/>
	  </os>
	  <features>
	    <acpi/>
	    <apic/>
	    <pae/>
	  </features>
	  <clock offset='utc'/>
	  <on_poweroff>destroy</on_poweroff>
	  <on_reboot>restart</on_reboot>
	  <on_crash>restart</on_crash>
	  <devices>
	    <emulator>/usr/bin/kvm</emulator>
	    <disk type='file' device='disk'>
	      <driver name='qemu' type='qcow2' cache='none' io='native'/>
	      <source file='/var/lib/libvirt/images/|version|.qcow2'/>
	      <target dev='sda' bus='scsi'/>
	    </disk>
	    <disk type='file' device='cdrom'>
	      <driver name='qemu' type='raw'/>
	      <target dev='sdb' bus='scsi'/>
	      <readonly/>
	    </disk>
	    <controller type='ide' index='0'>
	    </controller>
	    <controller type='usb' index='0'>
	    </controller>
	    <controller type='pci' index='0' model='pci-root'/>
	    <controller type='scsi' index='0'>
	    </controller>
	    <interface type='bridge'>
	      <mac address='52:54:00:00:00:02'/>
	      <source bridge='virbr0'/>
	      <model type='virtio'/>
	      <address type='pci' domain='0x0000' bus='0x00' slot='0x03' function='0x0'/>
	    </interface>
	    <serial type='pty'>
	      <target port='0'/>
	    </serial>
	    <console type='pty'>
	      <target type='serial' port='0'/>
	    </console>
	    <input type='mouse' bus='ps2'/>
	    <input type='keyboard' bus='ps2'/>
	    <graphics type='vnc' port='5900' autoport='no' listen='0.0.0.0' keymap='de'>
	      <listen type='address' address='0.0.0.0'/>
	    </graphics>
	    <video>
	      <model type='cirrus' vram='16384' heads='1'/>
	    </video>
	    <memballoon model='virtio'>
	    </memballoon>
	  </devices>
	</domain>	

#.	VirtualBox - Create a new virtual machine and select "already existing disk" or create a virtual 
	machine without a disk and add it afterwards.
	
