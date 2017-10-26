/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
"use strict";

export default [
  {
    property: "backstore_block_size",
    help: "Block size of the underlying device"
  },
  {
    property: "backstore_emulate_3pc",
    help: "If set to 1, enable Third Party Copy"
  },
  {
    property: "backstore_emulate_caw",
    help: "If set to 1, enable Compare and Write"
  },
  {
    property: "backstore_emulate_dpo",
    help: "If set to 1, turn on Disable Page Out"
  },
  {
    property: "backstore_emulate_fua_read",
    help: "If set to 1, enable Force Unit Access read"
  },
  {
    property: "backstore_emulate_fua_write",
    help: "If set to 1, enable Force Unit Access write"
  },
  {
    property: "backstore_emulate_model_alias",
    help: "If set to 1, use the back-end device name for the model alias"
  },
  {
    property: "backstore_emulate_rest_reord",
    help: "If set to 0, the Queue Algorithm Modifier is Restricted Reordering"
  },
  {
    property: "backstore_emulate_tas",
    help: "If set to 1, enable Task Aborted Status"
  },
  {
    property: "backstore_emulate_tpu",
    help: "If set to 1, enable Thin Provisioning Unmap"
  },
  {
    property: "backstore_emulate_tpws",
    help: "If set to 1, enable Thin Provisioning Write Same"
  },
  {
    property: "backstore_emulate_ua_intlck_ctrl",
    help: "If set to 1, enable Unit Attention Interlock"
  },
  {
    property: "backstore_emulate_write_cache",
    help: "If set to 1, turn on Write Cache Enable"
  },
  {
    property: "backstore_enforce_pr_isids",
    help: "If set to 1, enforce persistent reservation ISIDs"
  },
  {
    property: "backstore_fabric_max_sectors",
    help: "Maximum number of sectors the fabric can transfer at once"
  },
  {
    property: "backstore_hw_block_size",
    help: "Hardware block size in bytes"
  },
  {
    property: "backstore_hw_max_sectors",
    help: "Maximum number of sectors the hardware can transfer at once"
  },
  {
    property: "backstore_hw_pi_prot_type",
    help: "If non-zero, DIF protection is enabled on the underlying hardware"
  },
  {
    property: "backstore_hw_queue_depth",
    help: "Hardware queue depth"
  },
  {
    property: "backstore_is_nonrot",
    help: "If set to 1, the backstore is a non rotational device"
  },
  {
    property: "backstore_max_unmap_block_desc_count",
    help: "Maximum number of block descriptors for UNMAP"
  },
  {
    property: "backstore_max_unmap_lba_count",
    help: "Maximum number of LBA for UNMAP"
  },
  {
    property: "backstore_max_write_same_len",
    help: "Maximum length for WRITE_SAME"
  },
  {
    property: "backstore_optimal_sectors",
    help: "Optimal request size in sectors"
  },
  {
    property: "backstore_pi_prot_format",
    help: "DIF protection format"
  },
  {
    property: "backstore_pi_prot_type",
    help: "DIF protection type"
  },
  {
    property: "backstore_queue_depth",
    help: "Queue depth"
  },
  {
    property: "backstore_unmap_granularity",
    help: "UNMAP granularity"
  },
  {
    property: "backstore_unmap_granularity_alignment",
    help: "UNMAP granularity alignment"
  }
];
