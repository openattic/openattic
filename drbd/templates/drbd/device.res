# This file is generated automatically by openATTIC and will be overwritten
# automatically when the configuration changes.
#
# To alter sections of this file, edit `<openATTIC>/drbd/templates/drbd/device.res`,
# and run `<openATTIC>/installer.py -c -o drbd` to update DRBD.

resource {{ Device.res }} {
	protocol {{ Device.protocol }};
	
	startup {
		{% if Device.wfc_timeout          %}wfc-timeout          {{ Device.wfc_timeout          }};{% endif %}
		{% if Device.degr_wfc_timeout     %}degr-wfc-timeout     {{ Device.degr_wfc_timeout     }};{% endif %}
		{% if Device.outdated_wfc_timeout %}outdated-wfc-timeout {{ Device.outdated_wfc_timeout }};{% endif %}
	}
	
	disk {
		on-io-error {{ Device.on_io_error }};
		fencing     {{ Device.fencing     }};
	}
	
	handlers {
		fence-peer          "/usr/lib/drbd/crm-fence-peer.sh";
		after-resync-target "/usr/lib/drbd/crm-unfence-peer.sh";
	}
	
	net {
		{% if Device.cram_hmac_alg and Device.secret %}
		cram-hmac-alg {{ Device.cram_hmac_alg }};
		shared-secret {{ Device.secret  }};
		{% endif %}
		after-sb-0pri {{ Device.sb_0pri }};
		after-sb-1pri {{ Device.sb_1pri }};
		after-sb-2pri {{ Device.sb_2pri }};
	}
	
	{% if Device.syncer_rate %}
	syncer {
		rate {{ Device.syncer_rate }};
	}
	{% endif %}
	
	on {{ Hostname }} {
		device     {{ Device.path }};
		disk       {{ Device.basedev }};
		address    {{ Device.selfaddress }};
		meta-disk  internal;
	}
	
	on {{ Device.peerhost.name }} {
		device     {{ Device.peerdevice.path }};
		disk       {{ Device.peerdevice.basedev }};
		address    {{ Device.peeraddress }};
		meta-disk  internal;
	}
}
