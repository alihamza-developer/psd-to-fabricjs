<?php
session_start();
if (!defined('DIR')) define('DIR', './');
if (!defined('_DIR_')) define('_DIR_', DIR);
define('ENV', 'local');
require_once("functions.php");
require_once "Classes/TCExtension.php";
require_once "Classes/TCFunctions.php";
$timestamp = date('Y-m-d h:i:s');
@define('TMP_DIR', merge_path(_DIR_, 'temp') . '/');
