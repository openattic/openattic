{% comment %}
 Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
{% endcomment %}

resource {{ Connection.res_name }} {
	protocol {{ Connection.protocol }};
	meta-disk  internal;
	device /dev/drbd{{ Connection.id }};
	
	startup {
		{% if Connection.wfc_timeout          %}wfc-timeout          {{ Connection.wfc_timeout          }};{% endif %}
		{% if Connection.degr_wfc_timeout     %}degr-wfc-timeout     {{ Connection.degr_wfc_timeout     }};{% endif %}
		{% if Connection.outdated_wfc_timeout %}outdated-wfc-timeout {{ Connection.outdated_wfc_timeout }};{% endif %}
	}
	
	disk {
		on-io-error {{ Connection.on_io_error }};
		fencing     {{ Connection.fencing     }};
	}
	
	handlers {
		fence-peer          "/usr/lib/drbd/crm-fence-peer.sh";
		after-resync-target "/usr/lib/drbd/crm-unfence-peer.sh";
	}
	
	net {
		{% if Connection.cram_hmac_alg and Connection.secret %}
		cram-hmac-alg {{ Connection.cram_hmac_alg }};
		shared-secret {{ Connection.secret  }};
		{% endif %}
		after-sb-0pri {{ Connection.sb_0pri }};
		after-sb-1pri {{ Connection.sb_1pri }};
		after-sb-2pri {{ Connection.sb_2pri }};
	}
	
	{% if Connection.syncer_rate %}
	syncer {
		rate {{ Connection.syncer_rate }};
	}
	{% endif %}
	
	{% for endpoint in Connection.endpoint_set.all %}
	on {{ endpoint.volume.vg.host.name }} {
		disk       {{ endpoint.volume.device }};
		address    {{ endpoint.ipaddress.host_part }}:{{ Connection.id|add:"7700" }};
	}
	{% endfor %}
	
	{% for lowerconn in Connection.stacked_on.all %}
	stacked-on-top-of {{ lowerconn.res_name }} {
		address    {{ lowerconn.ipaddress.host_part }}:{{ Connection.id|add:"7700" }};
	}
	{% endfor %}
}
