# -*- coding: utf-8 -*-
"""
 *   Copyright (c) 2017 SUSE LLC
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""
import json
from operator import attrgetter
from collections import defaultdict


class Settings(object):
    NUMERIC = 0
    NUMERIC_ARRAY = 1
    STRING = 2

    def __init__(self, settings_structure):
        self.settings_structure = settings_structure
        self.settings = {}

    @staticmethod
    def _parse_numeric_value(key, val):
        try:
            return int(val)
        except ValueError:
            raise Exception('"{}" setting value "{}" is invalid'.format(key, val))

    @staticmethod
    def _parse_numeric_array_value(key, val):
        if not isinstance(val, list):
            raise Exception('"{}" setting value "{}" is invalid'.format(key, val))
        return [Settings._parse_numeric_value(key, v) for v in val]

    def _parse_value(self, key, val):
        val_type = self.settings_structure[key]
        if val_type == Settings.NUMERIC:
            res = Settings._parse_numeric_value(key, val)
        elif val_type == Settings.NUMERIC_ARRAY:
            res = Settings._parse_numeric_array_value(key, val)
        elif val_type == Settings.STRING:
            res = str(val)
        else:
            raise NotImplementedError()
        return res

    def __setitem__(self, key, val):
        if key not in self.settings_structure:
            return
        self.settings[key] = self._parse_value(key, val)

    def to_ui_dict(self):
        return self.settings


class ImageSettings(Settings):
    __SETTINGS__ = {
        'uuid': Settings.STRING,
        'lun': Settings.NUMERIC,
        'retries': Settings.NUMERIC,
        'sleep': Settings.NUMERIC,
        'retry_errors': Settings.NUMERIC_ARRAY,
        'backstore_block_size': Settings.NUMERIC,
        'backstore_emulate_3pc': Settings.NUMERIC,
        'backstore_emulate_caw': Settings.NUMERIC,
        'backstore_emulate_dpo': Settings.NUMERIC,
        'backstore_emulate_fua_read': Settings.NUMERIC,
        'backstore_emulate_fua_write': Settings.NUMERIC,
        'backstore_emulate_model_alias': Settings.NUMERIC,
        'backstore_emulate_rest_reord': Settings.NUMERIC,
        'backstore_emulate_tas': Settings.NUMERIC,
        'backstore_emulate_tpu': Settings.NUMERIC,
        'backstore_emulate_tpws': Settings.NUMERIC,
        'backstore_emulate_ua_intlck_ctrl': Settings.NUMERIC,
        'backstore_emulate_write_cache': Settings.NUMERIC,
        'backstore_enforce_pr_isids': Settings.NUMERIC,
        'backstore_fabric_max_sectors': Settings.NUMERIC,
        'backstore_hw_block_size': Settings.NUMERIC,
        'backstore_hw_max_sectors': Settings.NUMERIC,
        'backstore_hw_pi_prot_type': Settings.NUMERIC,
        'backstore_hw_queue_depth': Settings.NUMERIC,
        'backstore_is_nonrot': Settings.NUMERIC,
        'backstore_max_unmap_block_desc_count': Settings.NUMERIC,
        'backstore_max_unmap_lba_count': Settings.NUMERIC,
        'backstore_max_write_same_len': Settings.NUMERIC,
        'backstore_optimal_sectors': Settings.NUMERIC,
        'backstore_pi_prot_format': Settings.NUMERIC,
        'backstore_pi_prot_type': Settings.NUMERIC,
        'backstore_queue_depth': Settings.NUMERIC,
        'backstore_unmap_granularity': Settings.NUMERIC,
        'backstore_unmap_granularity_alignment': Settings.NUMERIC
    }

    def __init__(self):
        super(ImageSettings, self).__init__(ImageSettings.__SETTINGS__)

    def fill_lrbd_object(self, obj):
        for k, v in self.settings.items():
            obj[k] = v if k == 'retry_errors' else str(v)


class Image(object):
    def __init__(self, pool, name):
        self.pool = pool
        self.name = name
        self.settings = ImageSettings()

    def __eq__(self, other):
        return self.pool == other.pool and self.name == other.name

    def __ne__(self, other):
        return not self == other

    def __repr__(self):
        return "(pool: {}, name: {})".format(self.pool, self.name)

    def __hash__(self):
        return hash(self.pool) + hash(self.name)

    def to_ui_dict(self):
        return {
            'pool': self.pool,
            'name': self.name,
            'settings': self.settings.to_ui_dict()
        }


class Interface(object):
    def __init__(self, host, ip):
        self.host = host
        self.ip = ip

    def __eq__(self, other):
        return self.host == other.host and self.ip == other.ip

    def __ne__(self, other):
        return not self == other

    def __repr__(self):
        return "(host: {}, ip: {})".format(self.host, self.ip)

    def __hash__(self):
        return hash(self.host) + sum([hash(i) for i in self.ip])

    def to_ui_dict(self):
        return {
            'hostname': self.host,
            'interface': self.ip
        }


class Authentication(object):
    def __init__(self):
        self.has_authentication = False
        self.user = None
        self.password = None
        self.initiators = set()
        self.has_mutual_authentication = False
        self.mutual_enabled = False
        self.mutual_user = None
        self.mutual_password = None
        self.has_discovery_authentication = False
        self.discovery_enabled = False
        self.discovery_user = None
        self.discovery_password = None
        self.has_discovery_mutual_authentication = False
        self.discovery_mutual_enabled = False
        self.discovery_mutual_user = None
        self.discovery_mutual_password = None

    def parse_lrbd_dict(self, auth, initiators):
        if 'authentication' not in auth:
            return
        if auth['authentication'] not in ['none', 'tpg', 'tpg+identified']:
            raise Exception('Authentication type "{}" is not supported'
                            .format(auth['authentication']))

        if 'tpg' not in auth:
            return
        tpg = auth['tpg']
        if 'userid' not in tpg or 'password' not in tpg:
            return

        self.has_authentication = True
        self.user = tpg['userid']
        self.password = tpg['password']

        if auth['authentication'] == 'tpg+identified':
            self.initiators.update(initiators)

        if 'mutual' in tpg and 'userid_mutual' in tpg and 'password_mutual' in tpg:
            self.has_mutual_authentication = True
            self.mutual_enabled = tpg['mutual'] == 'enable'
            self.mutual_user = tpg['userid_mutual']
            self.mutual_password = tpg['password_mutual']

        if 'discovery' in auth:
            disc = auth['discovery']
            if 'auth' in disc and 'userid' in disc and 'password' in disc:
                self.has_discovery_authentication = True
                self.discovery_enabled = disc['auth'] == 'enable'
                self.discovery_user = disc['userid']
                self.discovery_password = disc['password']

            if 'mutual' in disc and 'userid_mutual' in disc and 'password_mutual' in disc:
                self.has_discovery_mutual_authentication = True
                self.discovery_mutual_enabled = disc['mutual'] == 'enable'
                self.discovery_mutual_user = disc['userid_mutual']
                self.discovery_mutual_password = disc['password_mutual']

    def parse_ui_dict(self, auth_dict):
        self.has_authentication = auth_dict['hasAuthentication']
        if self.has_authentication:
            self.user = auth_dict['user']
            self.password = auth_dict['password']
        self.initiators = set(auth_dict['initiators'])
        self.has_mutual_authentication = auth_dict['hasMutualAuthentication']
        if self.has_mutual_authentication:
            self.mutual_enabled = auth_dict['enabledMutualAuthentication']
            self.mutual_user = auth_dict['mutualUser']
            self.mutual_password = auth_dict['mutualPassword']
        self.has_discovery_authentication = auth_dict['hasDiscoveryAuthentication']
        if self.has_discovery_authentication:
            self.discovery_enabled = auth_dict['enabledDiscoveryAuthentication']
            self.discovery_user = auth_dict['discoveryUser']
            self.discovery_password = auth_dict['discoveryPassword']
        self.has_discovery_mutual_authentication = auth_dict['hasDiscoveryMutualAuthentication']
        if self.has_discovery_mutual_authentication:
            self.discovery_mutual_enabled = auth_dict['enabledDiscoveryMutualAuthentication']
            self.discovery_mutual_user = auth_dict['discoveryMutualUser']
            self.discovery_mutual_password = auth_dict['discoveryMutualPassword']

    def to_ui_dict(self):
        return {
            'hasAuthentication': self.has_authentication,
            'user': self.user,
            'password': self.password,
            'initiators': list(self.initiators),
            'hasMutualAuthentication': self.has_mutual_authentication,
            'enabledMutualAuthentication': self.mutual_enabled,
            'mutualUser': self.mutual_user,
            'mutualPassword': self.mutual_password,
            'hasDiscoveryAuthentication': self.has_discovery_authentication,
            'enabledDiscoveryAuthentication': self.discovery_enabled,
            'discoveryUser': self.discovery_user,
            'discoveryPassword': self.discovery_password,
            'hasDiscoveryMutualAuthentication': self.has_discovery_mutual_authentication,
            'enabledDiscoveryMutualAuthentication': self.discovery_mutual_enabled,
            'discoveryMutualUser': self.discovery_mutual_user,
            'discoveryMutualPassword': self.discovery_mutual_password
        }

    def gen_lrbd_object(self):
        obj = {}
        if not self.has_authentication:
            obj['authentication'] = 'none'
            return obj
        elif self.initiators:
            obj['authentication'] = 'tpg+identified'
        else:
            obj['authentication'] = 'tpg'
        tpg = {}
        obj['tpg'] = tpg
        tpg['userid'] = self.user
        tpg['password'] = self.password

        if self.has_mutual_authentication:
            tpg['mutual'] = 'enable' if self.mutual_enabled else 'disable'
            tpg['userid_mutual'] = self.mutual_user
            tpg['password_mutual'] = self.mutual_password

        if self.has_discovery_authentication:
            disc = {}
            obj['discovery'] = disc
            disc['auth'] = 'enable' if self.discovery_enabled else 'disable'
            disc['userid'] = self.discovery_user
            disc['password'] = self.discovery_password
            if self.has_discovery_mutual_authentication:
                disc['mutual'] = 'enable' if self.discovery_mutual_enabled else 'disable'
                disc['userid_mutual'] = self.discovery_mutual_user
                disc['password_mutual'] = self.discovery_mutual_password

        return obj


class TargetSettings(Settings):
    __SETTINGS__ = {
        'tpg_default_cmdsn_depth': Settings.NUMERIC,
        'tpg_default_erl': Settings.NUMERIC,
        'tpg_login_timeout': Settings.NUMERIC,
        'tpg_netif_timeout': Settings.NUMERIC,
        'tpg_prod_mode_write_protect': Settings.NUMERIC,
        'tpg_t10_pi': Settings.NUMERIC
    }

    def __init__(self):
        super(TargetSettings, self).__init__(TargetSettings.__SETTINGS__)

    def fill_lrbd_object(self, obj):
        for k, v in self.settings.items():
            obj[k] = str(v)


class Target(object):
    def __init__(self, target_id, interfaces=None, images=None, authentication=None):
        if interfaces is None:
            interfaces = set()
        if images is None:
            images = set()
        self.target_id = target_id
        self.interfaces = interfaces
        self.images = images
        if authentication is None:
            self.authentication = Authentication()
        self.settings = TargetSettings()

    def __repr__(self):
        return "id: {}\ninterfaces: {}\nimages: {}\nauthentication: {}".format(
            self.target_id,
            ''.join(["{}, ".format(i) for i in self.interfaces]),
            ''.join(["{}, ".format(p) for p in self.images]),
            self.authentication)

    def to_ui_dict(self):
        return {
            'targetId': self.target_id,
            'targetSettings': self.settings.to_ui_dict(),
            'portals': [i.to_ui_dict() for i in self.interfaces],
            'images': [i.to_ui_dict() for i in self.images],
            'authentication': self.authentication.to_ui_dict()
        }

    def _list_portals(self, portals):
        group_by_host = defaultdict(list)
        interfaces = sorted(self.interfaces, key=attrgetter('host', 'ip'))
        for i in interfaces:
            group_by_host[i.host].append(i.ip)

        result = []
        for host, addrs in group_by_host.items():
            portal = next(p for p in portals if p['host'] == host and p['addrs'] == addrs)
            result.append({'host': host, 'portal': portal['name']})
        return result

    def gen_target_lrbd_object(self, portals):
        obj = {'target': self.target_id}
        self.settings.fill_lrbd_object(obj)
        obj['hosts'] = self._list_portals(portals)
        return obj

    def gen_authentication_lrbd_object(self):
        obj = self.authentication.gen_lrbd_object()
        obj['target'] = self.target_id
        return obj

    def gen_gateway_lrbd_map(self):
        pools = {}
        for i in self.images:
            if i.pool not in pools:
                pools[i.pool] = {'target': self.target_id, 'tpg': []}
            obj = pools[i.pool]
            if self.authentication.initiators:
                for idx, ini in enumerate(self.authentication.initiators):
                    tpg = {'image': i.name, 'initiator': ini}
                    if idx == 0:
                        i.settings.fill_lrbd_object(tpg)
                    obj['tpg'].append(tpg)
            else:
                tpg = {'image': i.name}
                i.settings.fill_lrbd_object(tpg)
                obj['tpg'].append(tpg)
        return pools


class LRBDConf(object):
    def __init__(self, conf):
        self.conf = conf

    def _portal_interfaces(self, host, portal_name):
        interfaces = set()

        if 'portals' not in self.conf:
            return interfaces

        for portal in self.conf['portals']:
            if 'name' in portal and portal['name'] == portal_name and 'addresses' in portal:
                for address in portal['addresses']:
                    interfaces.add(Interface(host, address))

        return interfaces

    def _tgt_interfaces(self, tgt):
        interfaces = set()
        if 'hosts' in tgt:
            for host in tgt['hosts']:
                if 'host' not in host or 'portal' not in host:
                    continue
                interfaces = interfaces.union(self._portal_interfaces(host['host'],
                                                                      host['portal']))
        return interfaces

    def _find_target_tpgs(self, target_id, host):
        res = []
        if 'pools' not in self.conf:
            return res

        for pool in (p for p in self.conf['pools'] if 'gateways' in p):
            tpg = {'pool': pool['pool'], 'gateways': []}

            def gateway_filter(gtw):
                if 'target' in gtw and gtw['target'] == target_id and 'tpg' in gtw:
                    return True
                return 'host' in gtw and host is not None and gtw['host'] == host and 'tpg' in gtw

            tpg['gateways'].extend(filter(gateway_filter, pool['gateways']))

            res.append(tpg)
        return res

    def _find_target_auth(self, target_id, host):
        if 'auth' not in self.conf:
            return None
        for auth in self.conf['auth']:
            if 'target' in auth and auth['target'] == target_id:
                return auth
            elif 'host' in auth and host is not None and auth['host'] == host:
                return auth
        return None

    def targets(self):
        """
        This function parses the lrbd.conf JSON dictionary and constructs an
        intermediate class-based representation of the iSCSI targets configuration.

        Returns:
            list(Target): list of iSCSI targets
        """
        if 'targets' not in self.conf:
            return []

        result = []
        for tgt in self.conf['targets']:
            target_id = tgt['target']
            target = Target(target_id)

            for k, v in tgt.items():
                target.settings[k] = v

            host = tgt['host'] if 'host' in tgt else None
            pools = self._find_target_tpgs(target_id, host)

            initiators = set()
            for lrbd_pool in pools:
                for gtw in lrbd_pool['gateways']:
                    has_host = 'host' in gtw
                    for tpg in (t for t in gtw['tpg'] if 'image' in t):
                        image = Image(lrbd_pool['pool'], tpg['image'])
                        for k, v in tpg.items():
                            image.settings[k] = v
                        target.images.add(image)

                        if has_host and 'portal' in tpg:
                            interfaces = self._portal_interfaces(gtw['host'], tpg['portal'])
                        else:
                            interfaces = self._tgt_interfaces(tgt)

                        if 'initiator' in tpg:
                            initiators.add(tpg['initiator'])

                        target.interfaces.update(interfaces)
            auth = self._find_target_auth(target_id, host)
            if auth:
                target.authentication.parse_lrbd_dict(auth, initiators)
            result.append(target)
        return result


class LRBDUi(object):
    def __init__(self, target_models):
        self.targets = LRBDUi._targets(target_models)

    @staticmethod
    def _targets(target_models):
        """
        This function parses a list of iSCSI target NoDB models and constructs an
        intermediate class-based representation of the iSCSI targets configuration.

        Args:
            :type target_models list(ceph_deployment.models.iscsi_target.iSCSITarget)

        Returns:
            list(Target): list of iSCSI targets
        """
        result = []
        for tm in target_models:
            target = Target(tm.targetId)
            if tm.targetSettings:
                for k, v in tm.targetSettings.items():
                    target.settings[k] = v
            for p in tm.portals:
                target.interfaces.add(Interface(p['hostname'], p['interface']))
            for i in tm.images:
                image = Image(i['pool'], i['name'])
                if i['settings']:
                    for k, v in i['settings'].items():
                        image.settings[k] = v
                target.images.add(image)
            target.authentication.parse_ui_dict(tm.authentication)
            result.append(target)
        return result

    def _gen_portals(self):
        portals = []
        for t in self.targets:
            group_by_host = {}
            target_interfaces = sorted(t.interfaces, key=attrgetter('host', 'ip'))
            for i in target_interfaces:
                if i.host not in group_by_host:
                    group_by_host[i.host] = []
                group_by_host[i.host].append(i.ip)
            for host, addrs in group_by_host.items():
                found = False
                for p in portals:
                    if p['host'] == host and p['addrs'] == addrs:
                        found = True
                if not found:
                    portals.append({'host': host, 'addrs': addrs})
        return portals

    @staticmethod
    def _get_gateway_list(pools, pool_name):
        for p in pools:
            if p['pool'] == pool_name:
                return p['gateways']

        obj = {'pool': pool_name, 'gateways': []}
        pools.append(obj)
        return obj['gateways']

    def lrbd_conf_json(self):
        result = {
            'targets': [],
            'auth': [],
            'portals': [],
            'pools': []
        }
        portals = self._gen_portals()
        host_counter = {}
        for p in portals:
            if p['host'] not in host_counter:
                host_counter[p['host']] = 0
            host_counter[p['host']] += 1
            p_id = host_counter[p['host']]
            result['portals'].append({
                'name': 'portal-{}-{}'.format(p['host'], p_id),
                'addresses': p['addrs']
            })
            p['name'] = 'portal-{}-{}'.format(p['host'], p_id)

        for t in self.targets:
            result['targets'].append(t.gen_target_lrbd_object(portals))
            result['auth'].append(t.gen_authentication_lrbd_object())
            gtws = t.gen_gateway_lrbd_map()
            for pool, gtw in gtws.items():
                gs = LRBDUi._get_gateway_list(result['pools'], pool)
                gs.append(gtw)

        return json.dumps(result)
