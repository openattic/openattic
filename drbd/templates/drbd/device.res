resource r{{ Device.id }} {
	protocol C;
	
	startup {
		wfc-timeout           10;
		degr-wfc-timeout     120;
		outdated-wfc-timeout  15;
	}
	
	disk {
		on-io-error detach;
		fencing resource-only;
	}
	
	handlers {
		fence-peer          "/usr/lib/drbd/crm-fence-peer.sh";
		after-resync-target "/usr/lib/drbd/crm-unfence-peer.sh";	
	}
	
	net {
		cram-hmac-alg sha1;
		shared-secret "geheim";
		after-sb-0pri discard-younger-primary;
		after-sb-1pri discard-secondary;
	}
	
	syncer {
		rate 100M;
	}
	
	on {{ Hostname }} {
		device     {{ Device.path }};        # Name of virtual block dev
		disk       {{ Device.basedev }};     # block dev to be mirrored
		address    {{ Device.selfaddress }};
		meta-disk  internal;
	}
	
	on {{ Device.peername }} {
		device     /dev/drbd{{ Device.peerdevice.id }};
		disk       /dev/{{ Device.peerdevice.volume.vg.name }}/{{ Device.peerdevice.volume.name }};
		address    {{ Device.peeraddress }};
		meta-disk  internal;
	}
}
