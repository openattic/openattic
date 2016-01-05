<?php

/** openATTIC XMLRPC client library.
 *
 *  Usage:
 *
 *   $oa = new OpenAtticProxy("http://__:<apikey>@<host>:31234/");
 *   print_r($oa->volumes->StorageObject->all());
 *   print_r($oa->volumes->FileSystemVolume->filter(array("pool"=>5)));
 *
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
 */


class OpenAtticProxy {
	var $url;
	var $namespace;

	function OpenAtticProxy($url, $namespace=""){
		$this->url = $url;
		$this->namespace = $namespace;
	}

	function do_call($function_name, $function_args) {
		$request = xmlrpc_encode_request($function_name, $function_args);
		$header[] = "Content-type: text/xml";
		$header[] = "Content-length: ".strlen($request);
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $this->url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_TIMEOUT, 10);
		curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $request);

		$data = curl_exec($ch);
		if (curl_errno($ch)) {
			print curl_error($ch);
		} else {
			curl_close($ch);
			return xmlrpc_decode($data);
		}
	}

	function __get($key){
		if ($this->namespace !== ""){
			return new OpenAtticProxy($this->url, "{$this->namespace}.$key");
		}
		else{
			return new OpenAtticProxy($this->url, $key);
		}
	}

	function __call($func, $args){
		if ($this->namespace !== ""){
			$ret = $this->do_call("{$this->namespace}.$func", $args);
		}
		else {
			$ret = $this->do_call($func, $args);
		}
		if( is_array($ret) && xmlrpc_is_fault($ret) ){
			throw new Exception($ret["faultString"]);
		}
		return $ret;
	}
}


