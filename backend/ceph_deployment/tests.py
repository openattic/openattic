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

from ceph_deployment.deepsea import Glob, generate_globs, GlobSolution


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


class CGlobTestCase(TestCase):
    def test_glob_base(self):
        self.assertEqual(len({g(''), g('')}), 1)

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

