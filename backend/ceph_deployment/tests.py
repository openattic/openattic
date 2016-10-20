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

from django.test import TestCase

from ceph_deployment.deepsea import Glob, generate_globs, GlobSolution, PolicyCfg


def g(s):
    return Glob.from_string(s)


def gs(ss):
    if isinstance(ss, list):
        return GlobSolution({g(s) for s in ss})
    else:
        return GlobSolution(g(ss))


def fzs(*args):
    return {frozenset(s) if isinstance(s, set) else frozenset({s}) for s in args}


def gs_set_to_str_set(gss):
    return set(map(GlobSolution.str_set, gss))


class GlobTestCase(TestCase):
    def test_glob_base(self):
        self.assertEqual(len({g(''), g('')}), 1)

        star = Glob([(Glob.T_Any,)])
        self.assertEqual(star + star, star)

    def test_string(self):
        self.assertEqual(g('abc'), Glob([(1, 'a'), (1, 'b'), (1, 'c')]))
        self.assertEqual(g(''), Glob([]))
        self.assertEqual(str(g('aa')), 'aa')

    def test_glob_merges(self):
        self.assertEqual(g('aa').commonsuffix(g('aba')), Glob([(1, 'a')]))

        self.assertEqual(str(g('aa').merge_any(g('ab'))), '*')
        self.assertEqual(map(str, g('a').merge_one(g('b'))), ['?'])
        self.assertEqual(map(str, g('a').merge_range(g('b'))), ['[ab]'])

        self.assertEqual(set(map(str, g('aa').merge_all(g('ab')))), {'a[ab]', 'a*', 'a?'})
        self.assertEqual(map(str, g('').merge_all(g('a'))), ['*'])
        self.assertEqual(set(map(str, g('a').merge_all(g('bc')))),  {'[ab]*', '*', '?*'})

        self.assertEqual(gs_set_to_str_set(g('a').merge(g('bc'), [])), fzs('*', '?*', '[ab]*'))
        self.assertEqual(gs_set_to_str_set(g('a').merge(g('bc'), ['ac'])), fzs({'a', 'bc'}))

    def test_globs_merge(self):

        self.assertEqual(gs_set_to_str_set(gs('a').merge_solutions(gs('b'), [])),
                         fzs('*', '?', '[ab]'))
        self.assertEqual(gs_set_to_str_set(gs('a').merge_solutions(gs('b'), ['c'])),
                         fzs('[ab]'))

        self.assertEqual(gs_set_to_str_set(gs(['ab', 'bc']).merge_solutions(gs('ac'), [])),
                         fzs({'ab', '*c'},
                             {'ab', '?c'},
                             {'a*', 'bc'},
                             {'a?', 'bc'}))

        with self.assertRaises(ValueError):
            gs(['ab', 'bc']).merge_solutions(gs('ac'), ['ac'])
        self.assertEqual(gs_set_to_str_set(gs(['a', 'bb']).merge_solutions(gs('ccc'),
                                                                           ['ab', 'ac', 'bc'])),
                         fzs({'a', 'bb', 'ccc'}))

        one_any = Glob([(Glob.T_One,), (Glob.T_Any, )])
        one_one_any = Glob([(Glob.T_One,), (Glob.T_One,), (Glob.T_Any, )])
        self.assertEqual(gs_set_to_str_set(one_any.merge(one_one_any, [])), fzs('?*'))

    def test_gen_globs(self):
        self.assertEqual(generate_globs(['a', 'b', 'c'], []), frozenset(['*']))
        self.assertEqual(generate_globs(['a', 'b', 'c'], ['d']), frozenset(['[a-c]']))
        self.assertEqual(generate_globs(['a', 'b', 'd'], ['c']), frozenset(['[abd]']))
        self.assertEqual(generate_globs(['data1', 'data2', 'data3'], ['admin']),
                         frozenset(['data*']))
        self.assertEqual(generate_globs(['data1', 'data2', 'data3'], ['admin', 'data4']),
                         frozenset(['data[1-3]']))
        self.assertEqual(generate_globs(['data1', 'data2', 'data3'], ['admin', 'data1x']),
                         frozenset(['data?']))
        self.assertEqual(generate_globs(['ab', 'bc', 'ac'], ['bb']),
                         frozenset(['ab', '*c']))

        with self.assertRaises(ValueError):
            generate_globs(['a', 'b'], ['a'])

        self.assertEqual(generate_globs(['x1x', 'x2x', 'x3x'], ['xxx']), frozenset(['x[1-3]x']))
        self.assertEqual(generate_globs(['x1y3z', 'x2y2z', 'x3y1z'], ['xxyzz']),
                         frozenset(['x[1-3]y[1-3]z']))
        wl = ['data1', 'data2', 'mon1', 'mon2', 'mon3', 'igw1', 'igw2']
        bl = ['client1', 'client2', 'admin1', 'admin2', 'rgw1', 'rgw2']

        self.assertEqual(generate_globs(wl, bl), frozenset(['[dim][ago][ntw]*', 'data1']))


class PolicyCfgTestCase(TestCase):
    files = [("""
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
""", ['data1', 'data2', 'admin', 'mon1', 'mon2']), ("""

# Cluster assignment
cluster-ceph/cluster/*.sls
cluster-unassigned/cluster/client*.sls
# Hardware Profile
2Disk2GB-1/cluster/data*.sls
2Disk2GB-1/stack/default/ceph/minions/data*.ceph.yml
# Common configuration
config/stack/default/global.yml
config/stack/default/ceph/cluster.yml
# Role assignment
role-master/cluster/admin*.sls
role-admin/cluster/mon*.sls
role-admin/cluster/igw*.sls
role-admin/cluster/data*.sls
role-igw/cluster/igw*.sls
role-rgw/cluster/rgw*.sls
role-mon/cluster/mon*.sls
role-mds/cluster/mon[12]*.sls
role-mon/stack/default/ceph/minions/mon*.yml""", ['client1', 'client2', 'data1', 'data2', 'admin1',
                                                  'admin2', 'mon1', 'mon2', 'mon3', 'igw1', 'igw2',
                                                  'rgw1', 'rgw2'])
    ]
    hw_profiles = ['2Disk2GB-1', 'other_profile']

    def test_identity(self):
        for content, minion_names in PolicyCfgTestCase.files:
            generated = str(
                PolicyCfg(content.splitlines(False), minion_names, PolicyCfgTestCase.hw_profiles))

            self.assertEqual(
                PolicyCfg(generated.splitlines(), minion_names, PolicyCfgTestCase.hw_profiles),
                PolicyCfg(content.splitlines(), minion_names, PolicyCfgTestCase.hw_profiles))

    def test_attributes(self):
        hw = PolicyCfgTestCase.hw_profiles
        content, minion_names = PolicyCfgTestCase.files[0]
        lines = content.splitlines(False)
        for cfg in [PolicyCfg(lines, minion_names, hw),
                    PolicyCfg(str(PolicyCfg(lines, minion_names, hw)).splitlines(), minion_names,
                              hw)]:
            self.assertEqual(dict(cfg.cluster_assignment), {'ceph': set(minion_names)})
            self.assertEqual(dict(cfg.hardware_profiles), {'2Disk2GB-1': {'data1', 'data2'}})
            self.assertEqual(dict(cfg.role_assigments),
                             {
                                 'master': {'admin'},
                                 'admin': {'admin', 'mon1', 'mon2'},
                                 'mon': {'mon1', 'mon2'},
                             })

        content, minion_names = PolicyCfgTestCase.files[1]
        lines = content.splitlines(False)
        for cfg in [PolicyCfg(lines, minion_names, hw),
                    PolicyCfg(str(PolicyCfg(lines, minion_names, hw)).splitlines(), minion_names,
                              hw)]:
            self.assertEqual(dict(cfg.cluster_assignment), {'ceph': set(minion_names),
                                                            'unassigned': {'client1', 'client2'}})
            self.assertEqual(dict(cfg.hardware_profiles), {'2Disk2GB-1': {'data1', 'data2'}})
            self.assertEqual(dict(cfg.role_assigments),
                             {
                                 'master': {'admin1', 'admin2'},
                                 'admin': {'igw1', 'igw2', 'mon1', 'mon2', 'mon3', 'data1',
                                           'data2'},
                                 'igw': {'igw1', 'igw2'},
                                 'rgw': {'rgw1', 'rgw2'},
                                 'mon': {'mon1', 'mon2', 'mon3'},
                                 'mds': {'mon1', 'mon2'},
                             })
