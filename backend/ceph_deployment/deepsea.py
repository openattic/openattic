# -*- coding: utf-8 -*-
"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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
import copy
import logging
import os
import fnmatch
import re
import yaml

from collections import defaultdict
from contextlib import contextmanager
from functools import total_ordering
from itertools import chain, product
from os.path import commonprefix

from django.core.exceptions import ValidationError

from ceph_deployment.systemapi import salt_cmd
from ceph_deployment.conf import settings as ceph_deployment_settings
from systemd import get_dbus_object
from utilities import aggregate_dict

logger = logging.getLogger(__name__)


def get_config():
    """
    Returns a list of all minions, where each minion
    is a dict of the pillar data, e.g.
        * ip-address,
        * hostname
        * role
        * cluster fsid
        * key_accepted (boolean)
        * roles
    May be similar to:

    >>> import subprocess
    >>> subprocess.check_output(['salt', '*', 'pillar.items'])

    """
    out = salt_cmd().invoke_salt(['*', 'pillar.items'])
    return [
        aggregate_dict(data, hostname=hostname)
        for (hostname, data)
        in out.iteritems()
    ]

minion_roles = ['storage', 'mon', 'mds', 'rgw', 'master', 'admin']


def add_role(minion, role):
    """
    Adds a role to a given host. E.g. "storage", "mon", "mds", "rgw"
    Ceph cluster already set up. Afterwards, also edit the stack file.

    :type minion: str | unicode
    :type role: str
    """
    assert role in minion_roles
    filename = os.path.join(ceph_deployment_settings.DEEPSEA_PILLAR_ROOT, 'cluster',
                            minion + '.sls')

    with open(filename) as f:
        contents = yaml.safe_load(f)
    original_content = copy.deepcopy(contents)

    if 'roles' not in contents:
        contents['roles'] = [role]
    elif role not in contents['roles']:
        contents['roles'].append(role)
    else:
        return  # already present

    dumper = yaml.SafeDumper
    dumper.ignore_aliases = lambda self, data: True
    content = yaml.dump(contents, Dumper=dumper, default_flow_style=False)
    get_dbus_object("/ceph_deployment").write_pillar_file(filename, content)
    try:
        validate_pillar_data()
    except ValidationError:
        print "resetting"
        old_content = yaml.dump(original_content, Dumper=dumper, default_flow_style=False)
        get_dbus_object("/ceph_deployment").write_pillar_file(filename, old_content)
        raise


def set_storage_configuration(hostname, storage_configuration):
    """
    Sets the storage configuration as returned by
    get_possible_storage_configurations()
    """
    pass


def get_possible_storage_configurations(hostname):
    """
    Returns a list of proposals, of how this node
    could be configured.
    """
    pass


def deepsea_stage_0():
    salt_cmd().invoke_salt_run(['state.orch', 'ceph.stage.0'])
    pass


def deepsea_stage_1():
    salt_cmd().invoke_salt_run(['state.orch', 'ceph.stage.1'])
    pass


def deepsea_stage_2():
    salt_cmd().invoke_salt_run(['state.orch', 'ceph.stage.2'])
    pass


def deepsea_stage_3():
    salt_cmd().invoke_salt_run(['state.orch', 'ceph.stage.3'])
    pass


def deepsea_stage_4():
    salt_cmd().invoke_salt_run(['state.orch', 'ceph.stage.4'])
    pass

@contextmanager
def policy_cfg(minion_names):
    """
    # cluster assignment
    cluster-ceph/cluster/*.sls
    #cluster-unassigned/cluster/client*.sls

    # Hardware Profile
    #2Dsk2GB-1/cluster/data*.sls
    2Disk2GB-1/cluster/data*.sls
    #2Dsk2GB-1/stack/default/ceph/minions/data*.ceph.yml
    2Disk2GB-1/stack/default/ceph/minions/data*.ceph.yml

    # Common configuration
    config/stack/default/global.yml
    config/stack/default/ceph/cluster.yml

    # Role assignment
    role-master/cluster/admin*.sls
    role-admin/cluster/mon*.sls
    #role-admin/cluster/igw*.sls
    #role-admin/cluster/data*.sls
    role-admin/cluster/admin*.sls
    #role-igw/cluster/igw*.sls
    role-mon/cluster/mon*.sls
    #role-mds/cluster/mon[12]*.sls

    # Default stuff
    role-mon/stack/default/ceph/minions/mon*.yml
    """

    file = '/srv/pillar/ceph/proposals/policy.cfg'

    with open(file) as f:
        cfg = PolicyCfg(f, minion_names)
    yield cfg
    with open(file, 'w') as f:
        f.write(str(cfg))


class PolicyCfg(object):
    def __init__(self, f, minion_names):
        self.minion_names = minion_names
        self._cluster_assignment = set()
        self._hardware_profiles = defaultdict(set)
        self._common_configuration = [
            'config/stack/default/global.yml'
            'config/stack/default/ceph/cluster.yml'
        ]
        self._role_assigments = defaultdict(set)
        self._default_stuff = set()

        for line in f:
            self.read_cluster_assignment(line)
            self.read_hardware_profiles(line)
            self.read_role_assigments(line)

    def get_globs(self, whitelist):
        return generate_globs(whitelist, set(self.minion_names).difference(whitelist))

    def read_cluster_assignment(self, line):
        res = re.match(r'^cluster-ceph/cluster/(.*).sls$', line)
        if res is None:
            return
        minions = fnmatch.filter(self.minion_names, res.groups()[0])
        self._cluster_assignment.update(minions)

    @property
    def cluster_assignment(self):
        return '\n'.join(['cluster-ceph/cluster/{}.sls'.format(glob) for glob in
                          self.get_globs(self._cluster_assignment)])


    def read_hardware_profiles(self, line):
        res = re.match(r'^([^#]*Disk[^/]*)/cluster/(.*).sls$', line)
        if res is None:
            return
        profile, pattern = res.groups()
        minions = fnmatch.filter(self.minion_names, pattern)
        self._hardware_profiles[profile].update(minions)

    @property
    def hardware_profiles(self):
        def globs_for_profile(profile, minions):
            return [
                (profile, glob)
                for glob in self.get_globs(minions)
            ]
        tuples = chain.from_iterable(
            [globs_for_profile(profile, minions)
             for profile, minions
             in sorted(self._hardware_profiles.items())]
        )
        lines = ['{}/cluster/{}.sls'.format(*line) for line in tuples]
        lines += ['{}/cluster/default/ceph/minion/{}.sls'.format(*line) for line in tuples]
        return '\n'.join(lines)

    @property
    def common_configuration(self):
        return '\n'.join(self._common_configuration)

    def read_role_assigments(self, line):
        res = re.match(r'^role-(.*)/cluster/(.*).sls$', line)
        if res is None:
            return
        role, pattern = res.groups()
        minions = fnmatch.filter(self.minion_names, pattern)
        self._role_assigments[role].update(minions)
        if role == 'mon':
            self._default_stuff.update(minions)

    @property
    def role_assignments(self):
        def globs_for_role(role, minions):
            return [
                (role, glob)
                for glob in self.get_globs(minions)
            ]
        tuples = chain.from_iterable(
            [globs_for_role(role, minions)
             for role, minions
             in sorted(self._role_assigments.items())]
        )
        lines = ['role-{}/cluster/{}.sls'.format(*line) for line in tuples]
        return '\n'.join(lines)

    @property
    def default_stuff(self):
        mons = self._role_assigments["mon"]
        globs = self.get_globs(mons)
        return '\n'.join(['role-mon/stack/default/ceph/minions/{}.yml'.format(glob) for glob in globs])

    def __str__(self):
        content = """
# cluster assignment
{self.cluster_assignment}
#cluster-unassigned/cluster/client*.sls

# Hardware Profile
{self.hardware_profiles}

# Common configuration
{self.common_configuration}

# Role assignment
{self.role_assignments}

# Default stuff
{self.default_stuff}
""".format(self=self)
        return content

    def __eq__(self, other):
        return self._cluster_assignment == other._cluster_assignment \
               and self._hardware_profiles == other._hardware_profiles \
               and self._common_configuration == other._common_configuration \
               and self._default_stuff == other._default_stuff \
               and self._role_assigments == other._role_assigments

    def __repr__(self):
        return 'PolicyCfg("""{}""", {})'.format(str(self), repr(self.minion_names))


def validate_pillar_data():
    out = salt_cmd().invoke_salt_run_quiet(['validate.pillars'])

    def format_errors(name, errors):
        return [
            "{}: {}: {}".format(name, key, '\n'.join(error))
            for key, error
            in errors.items()
        ]

    def format_cluster(name, cluster):
        if 'errors' in cluster:
            return format_errors(name, cluster['errors'])
        else:
            return []

    all_errors = list(
        chain.from_iterable([format_cluster(name, cluster) for name, cluster in out.items()]))
    if all_errors:
        raise ValidationError({'detail': all_errors})


def generate_globs(whitelist, blacklist):
    """
    Generate a list of globs that match all elements of whitelist and none of blacklist.

    >>> import fnmatch
    >>> whitelist, blacklist = [], []
    >>> globs = generate_globs(whitelist, blacklist)
    >>> assert all([any([fnmatch.filter([white], glob) for glob in globs]) for white in
    >>>            whitelist])
    >>> assert not any([fnmatch.filter(blacklist, glob) for glob in globs])

    :type whitelist: list[str]
    :type blacklist: list[str]
    :rtype: frozenset[str]
    :raise ValueError: If white and blacklist overlap.
    """

    def is_odd_len(l):
        return len(l) % 2 != 0

    def merge_globs_rec(globs):
        """
        merge_globs_rec merges two glob proposals in a tree-like way.

        :type globs: list[str]
        :rtype: set[GlobSolution]
        """
        if len(globs) == 1:
            return {GlobSolution(Glob.from_string(globs[0]))}

        first_half = globs[:len(globs) // 2]
        second_half = globs[len(globs) // 2:]

        return merge_two_globs_proposals(merge_globs_rec(first_half),
                                         merge_globs_rec(second_half),
                                         blacklist)

    if not whitelist:
        return []

    res = merge_globs_rec(list(whitelist))
    best_globs = sorted(res, key=lambda s: s.complexity())[0]

    # TODO: remove, if your confidence level in generate_globs() is high enough.
    assert all([any([fnmatch.filter([white], glob) for glob in best_globs.str_set()]) for white in
                whitelist])
    assert not any([fnmatch.filter(blacklist, glob) for glob in best_globs.str_set()])

    return best_globs.str_set()


def merge_two_globs_proposals(ls, rs, blacklist):
    """
    Generates a set of all merged glob proposals. All results match the union of ls and rs.

    :type ls: set[GlobSolution]
    :type rs: set[GlobSolution]
    :rtype: set[GlobSolution]
    """

    proposals = set()
    for l, r in product(ls, rs):
        proposals.update(l.merge_solutions(r, blacklist))
    return set(sorted(proposals, key=lambda s: s.complexity())[:3])


class GlobSolution(object):
    """Represents one solution of multiple globs"""

    def __init__(self, globs):
        """:type globs: iterable[Glob] | Glob"""
        if isinstance(globs, Glob):
            self.globs = frozenset({globs})
        elif isinstance(globs, frozenset):
            self.globs = globs
        elif isinstance(globs, set):
            self.globs = frozenset(globs)
        else:
            assert False

    def merge_solutions(self, rs, blacklist):
        """
        Generate lots of solutions for these two solutions. All results match both input solutions.

        :type rs: GlobSolution
        :type blacklist: list[str]
        :rtype: set[GlobSolution]
        """

        ret = []
        for l, r in product(self.globs, rs.globs):
            merges = l.merge(r, blacklist)
            for merge in merges:
                merge_set = set(merge.globs)

                ls_no_l = set(self.globs).difference({l})
                rs_no_r = set(rs.globs).difference({r})

                merge_set.update(ls_no_l)
                merge_set.update(rs_no_r)
                ret.append(GlobSolution(merge_set))

        return set(sorted(ret, key=lambda s: s.complexity())[:4])

    def __str__(self):
        return 'GlobSolution({})'.format(map(str, self.globs))

    def complexity(self):
        return sum((8 + g.complexity() for g in self.globs))

    def __hash__(self):
        return hash(self.globs)

    def __eq__(self, other):
        return self.globs == other.globs

    def str_set(self):
        return frozenset(map(str, self.globs))

    def __repr__(self):
        return str(self)


@total_ordering
class Glob(object):
    T_Char = 1  # Matches a specific char "x"
    T_Any = 2  # Matches any string "*"
    T_One = 3  # Matches one character "?"
    T_Range = 4  # Matches a set of chars "[a-z1-5]"

    def __init__(self, elems=None):
        """:type elems: list | tuple"""
        if elems is None:
            self.elems = tuple()
        elif isinstance(elems, Glob):
            self.elems = elems.elems
        elif isinstance(elems, list):
            self.elems = tuple(elems)
        else:
            assert isinstance(elems, tuple)
            self.elems = elems

    @staticmethod
    def from_string(s):
        return Glob([(Glob.T_Char, c) for c in s])

    @staticmethod
    def make_range_string(range):
        """
        Generates strings like "a-c" or "abde" or "1-5e-g"

        :type range: set[str]
        """
        def split_chunks(l):
            """
            Generates a list of lists of neighbouring chars.

            :rtype list[list[int]]
            """
            ret = [[l[0]]]
            for c in l[1:]:
                if ret[-1][-1] == c - 1:
                    ret[-1].append(c)
                else:
                    ret.append([c])
            return ret

        l = sorted(map(ord, range))
        chunks = split_chunks(l)
        return ''.join([
            ''.join(map(chr, chunk)) if len(chunk) <= 2 else '{}-{}'.format(
                chr(chunk[0]), chr(chunk[-1]))
            for chunk
            in chunks
            ])

    def __str__(self):
        def mk1(elem):
            return {
                Glob.T_Char: lambda: elem[1],
                Glob.T_Any: lambda: '*',
                Glob.T_One: lambda: '?',
                Glob.T_Range: lambda: '[{}]'.format(self.make_range_string(elem[1])),
            }[elem[0]]()
        return ''.join(map(mk1, self.elems))

    def __getitem__(self, val):
        ret = self.elems.__getitem__(val)
        if isinstance(ret, list):
            return Glob(ret)
        if isinstance(ret, tuple) and (not ret or isinstance(ret[0], tuple)):
            return Glob(ret)
        if isinstance(ret, Glob):
            return ret
        assert isinstance(ret, tuple)
        return ret

    def __eq__(self, other):
        return self.elems == other.elems

    def __lt__(self, other):
        return self.elems < other.elems

    def __hash__(self):
        return hash(self.elems)

    def complexity(self):
        """Returns a complexity indicator. Simple glob expressions are preferred."""
        def complexity1(index, e):
            ret = {
                Glob.T_Char: lambda: 0.0,
                Glob.T_Any: lambda: 1.0,
                Glob.T_One: lambda: 2.0,
                Glob.T_Range: lambda: max(3, len(self.make_range_string(e[1]))),  # prefer small
            }[e[0]]()
            if e[0] != Glob.T_Char and index != len(self) - 1:
                ret += 0.5  # Prefer globing last character
            return ret

        return sum((complexity1(index, elem) for index, elem in enumerate(self.elems)))

    def merge(self, r, blacklist):
        """
        Merges this glob with `r` by creating multiple solutions. Filters all solutions that
        violate the blacklist.

        :type r: Glob
        :rtype: set[GlobSolution]
        :raise ValueError: If either self or r matches the blacklist.
        """
        for e in [self, r]:
            if any((fnmatch.fnmatch(black, str(e)) for black in blacklist)):
                raise ValueError('Glob "{}" already matches blacklist.'.format(e))

        merged = self.merge_all(r)
        ok = {e for e in merged if not any((fnmatch.fnmatch(black, str(e)) for black in blacklist))}
        ok = sorted(ok, key=Glob.complexity)[:3]
        ret = {GlobSolution(e) for e in ok} if ok else {GlobSolution({self, r})}
        if self.complexity() > 1 and r.complexity() > 1 and sum([gs.complexity() for gs in ret]):
            logger.debug('{} + {} = {}'.format(str(self), str(r), str(ret)))
        return ret

    def merge_all(self, r):
        """
        Generates a set of all possible merges between self and r. Can be empty.

        :type r: Glob
        :rtype: set[Glob]"""
        if self == r:
            return {self}
        if not self or not r:
            return {self.merge_any(r)}

        prefix = self.commonprefix(r)
        suffix = self[len(prefix):].commonsuffix(r[len(prefix):])
        mid_l = self[len(prefix):len(self)-len(suffix)]
        mid_r = r[len(prefix):len(r)-len(suffix)]

        def fix(merged):
            if merged is None:
                return None
            return prefix + merged + suffix

        ret = set()
        ret.add(fix(mid_l.merge_any(mid_r)))

        one_merged = mid_l.merge_one(mid_r)
        if one_merged is not None:
            ret.update(map(fix, one_merged))

        range_merged = mid_l.merge_range(mid_r)
        if range_merged is not None:
            ret.update(map(fix, range_merged))

        if None in ret:
            ret.remove(None)
        return ret

    def __add__(self, other):
        if self.elems[-1:] == ((Glob.T_Any, ), ) and other.elems[:1] == ((Glob.T_Any, ), ):
            return Glob(self.elems + other.elems[1:])
        return Glob(self.elems + other.elems)

    def __nonzero__(self):
        return bool(self.elems)

    def __len__(self):
        return len(self.elems)

    def merge_any(self, r):
        if not self and not r:
            return Glob()
        return Glob([(Glob.T_Any, )])

    def merge_one(self, r):
        def one(e1, e2):
            t_1 = e1[0]
            t_2 = e2[0]
            if t_1 == Glob.T_Char and t_2 == Glob.T_Char:
                if e1[1] != e2[1]:
                    return (Glob.T_One, )
                else:
                    return Glob.T_Char, e2[1]
            if Glob.T_Any in [t_1, t_2]:
                return None
            return (Glob.T_One,)

        length = min(len(self), len(r))
        ranges = [one(e1, e2) for e1, e2 in zip(self[:length], r[:length])]
        if any([range is None for range in ranges]):
            return None
        ends = self[length:].merge_all(r[length:])
        return {Glob(ranges) + Glob(merged.elems) for merged in ends}

    def merge_range(self, r):
        """:rtype: set[Glob]"""
        def combine_range_char(r1, c):
            return Glob.T_Range, frozenset(r1[1].union({c[1]}))

        def combine_ranges(r1, r2):
            return Glob.T_Range, frozenset(r1[1].union(r2[1]))

        def one(e1, e2):
            t_1 = e1[0]
            t_2 = e2[0]
            if t_1 == Glob.T_Char and t_2 == Glob.T_Char:
                if e1[1] != e2[1]:
                    return Glob.T_Range, frozenset({e1[1], e2[1]})
                else:
                    return Glob.T_Char, e2[1]
            if t_1 == Glob.T_Range and t_2 == Glob.T_Char:
                return combine_range_char(e1, e2)
            if t_1 == Glob.T_Char and t_2 == Glob.T_Range:
                return combine_range_char(e2, e1)
            if t_1 == Glob.T_Range and t_2 == Glob.T_Range:
                return combine_ranges(e1, e2)
            if (t_1 == Glob.T_Range and t_2 == Glob.T_One) or (
                    t_1 == Glob.T_One and t_2 == Glob.T_Range):
                return (Glob.T_One,)
            return None

        length = min(len(self), len(r))
        ranges = [one(e1, e2) for e1, e2 in zip(self[:length], r[:length])]
        if any([range is None for range in ranges]):
            return None
        ends = self[length:].merge_all(r[length:])
        return {Glob(ranges) + Glob(merged.elems) for merged in ends}

    def commonsuffix(self, r):
        return self[::-1].commonprefix(r[::-1])[::-1]

    def commonprefix(self, r):
        return Glob(commonprefix([self, r]))

    def __repr__(self):
        return 'Glob(({}))'.format(', '.join([repr(elem) for elem in self.elems]))
