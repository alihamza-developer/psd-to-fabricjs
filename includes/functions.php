<?php
// check json
function isJson($string)
{
    json_decode($string);
    return json_last_error() == JSON_ERROR_NONE;
}
// trim function
function tooTrim($str)
{
    return trim($str);
}
// To snake case
function toSnakeCase($str)
{
    if (gettype($str) !== "string") return $str;
    $str = strtolower($str);
    $str = preg_replace('/[ ]/', '_', $str);
    return $str;
}
function fromCamelCase($camelCaseString)
{
    $re = '/(?<=[a-z])(?=[A-Z])/x';
    $a = preg_split($re, $camelCaseString);
    return implode(' ', $a);
}
function fromSnakeCase($string)
{
    return preg_replace('/[_]/', " ", $string);
}
// To Noraml case
function toNormalCase($str)
{
    if (gettype($str) !== "string") return $str;
    $str = fromCamelCase($str);
    $str = fromSnakeCase($str);
    return $str;
}
// To number
function toNumber($str, $isFloat = false)
{
    $str = tooTrim($str);
    $regex = $isFloat ? '/[^0-9.]/m' : '/[^0-9]/m';
    $number = preg_replace($regex, '', $str);
    $number = $isFloat ? floatval($number) : intval($number);
    return $number;
}
// To Month Date
function monthDate($date2)
{
    $date1 = date("Y-m-d");
    $date2 = explode(" ", $date2);
    $date2 = $date2[0];
    $date2 = date("d F, Y", strtotime($date2));
    return $date2;
}
// JSON Message
function create_json_message($type, $data, $options = [])
{
    $msg = [
        'status' => $type,
        'data' => $data
    ];
    $redirect = arr_val($options, "redirect");
    if ($redirect) $msg['redirect'] = $redirect;

    foreach ($options as $key => $value) {
        $msg[$key] = $value;
    }

    return json_encode($msg);
}
// Success Msg
function success($data = "Data Updated Successfully!", $options = [])
{
    return create_json_message("success", $data, $options);
}
// Error Msg
function error($data = "Error Please Try Again!", $options = [])
{
    return create_json_message("error", $data, $options);
}
function returnError($data, $options = [])
{
    return error($data, $options);
}
function returnSuccess($data = "Data Updated Successfully!", $options = [])
{
    echo success($data, $options);
    die();
}
// Redirect To
function redirectTo($url)
{
    echo '<script>location.assign("' . $url . '");</script>';
    die();
}
function bc_code()
{
    return md5(rand(100, 9999));
}
function is_image_file($file_name)
{
    $allowed_ext = array('jpg', 'jpeg', 'png', 'gif', 'jfif');
    $getExt = explode('.', $file_name);
    $ext = strtolower(end($getExt));
    if (in_array($ext, $allowed_ext)) {
        return $ext;
    } else {
        return false;
    }
}
function get_date_with($term)
{
    return date("Y-m-d", strtotime(date("Y-m-d") . $term));
}
// Get Array Value
function arr_val($arr, $key, $default = false)
{
    $default = isset($arr[$key]) ? $arr[$key] : $default;
    return $default;
}
// Genere Random Name
function getRand($length = 5)
{
    $random_str = "";
    $codeAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $codeAlphabet .= "abcdefghijklmnopqrstuvwxyz";
    $codeAlphabet .= "0123456789";
    $max = strlen($codeAlphabet);

    for ($i = 0; $i < $length; $i++) {
        $random_str .= $codeAlphabet[random_int(0, $max - 1)];
    }

    return $random_str;
}
// Read Text File
function read_text_file($filepath)
{
    if (!file_exists($filepath)) return false;
    $data = "";
    $handle = fopen($filepath, "r");
    if ($handle) {
        while (($line = fgets($handle)) !== false) {
            $data .= $line;
        }
        fclose($handle);
    }
    return $data;
}
// JS Message
function js_msg($type, $msg, $heading = null)
{
    if (is_null($heading)) $heading = $type;
    $options = [
        'type' => $type
    ];
    return "sAlert('$msg', '$heading', " . json_encode($options) . ")";
}
// Get Param
function _get_param($param_name, $default_value = "")
{
    $value = $default_value;
    if (isset($_GET[$param_name])) $value = $_GET[$param_name];
    return $value;
}
// get Post Param
function _post_param($param_name, $default_value = "")
{
    $value = $default_value;
    if (isset($_POST[$param_name])) $value = $_POST[$param_name];
    return $value;
}
// get File Param
function _file_param($param_name, $default_value = "")
{
    $value = $default_value;
    if (isset($_FILES[$param_name])) $value = $_FILES[$param_name];
    return $value;
}
// Return Request Error
function _REQUEST_ERROR($msg, $output_msg = false)
{
    if (!$output_msg) $output_msg = error("MSG_HERE");
    $output_msg = str_replace('MSG_HERE', $msg, $output_msg);
    echo $output_msg;
    die();
}
// Get Request Parameter
function _REQUEST($request_type, $param_name, $options)
{
    $required = array_key_exists("required", $options) ? $options['required'] : true;
    $required = array_key_exists("default", $options) ? false : $required;

    $default_value = $required ? false : "";
    // Default value
    $default_value = arr_val($options, "default", $default_value);

    $value = false;
    if ($request_type === "POST")
        $value = _post_param($param_name, $default_value);
    else if ($request_type === "GET")
        $value = _get_param($param_name, $default_value);
    else if ($request_type === "FILES")
        $value = _file_param($param_name, $default_value);

    if (!$required) return $value;
    if (!in_array(gettype($value), ['string', 'boolean', 'integer', 'float'])) return $value;
    $valid = $value === false ? false : true;

    $param = toNormalCase($param_name);
    $param = arr_val($options, "param_name", $param);
    // output message
    $output_msg = arr_val($options, 'output_msg', error("MSG_HERE"));
    if (!$valid) _REQUEST_ERROR("$param is required", $output_msg);
    // check possibel values
    $values = arr_val($options, 'values');
    if ($values) {
        if (!in_array($value, $values)) {
            $msg = "invalid $param value!";
            if (arr_val($options, 'show_values', true))
                $msg = "$param should be " . implode(' || ', $values);
            _REQUEST_ERROR($msg, $output_msg);
        }
    }

    $length = strlen(tooTrim($value));
    // Allow empty
    $empty = arr_val($options, 'empty');
    if ($empty) return $value;
    else if ($length < 1) _REQUEST_ERROR("$param is not allowed to be empty", $output_msg);

    // Check min length
    $min = arr_val($options, 'min');
    if ($min) {
        if (strlen($value) < $min) _REQUEST_ERROR("$param min length should be $min", $output_msg);
    }

    // Check max length
    $max = arr_val($options, 'max');
    if ($max) {
        if (strlen($value) > $max) _REQUEST_ERROR("$param max length should be $max", $output_msg);
    }


    return $value;
}
// get request post param
function _POST($param_name, $options = [])
{
    return _REQUEST("POST", $param_name, $options);
}
// get request get param
function _GET($param_name, $options = [])
{
    return _REQUEST("GET", $param_name, $options);
}
// Get request param with full page error
function _GET_($param_name, $options = [])
{
    $options['output_msg'] = showMsgPage([
        'type' => 'error',
        'msg' => 'MSG_HERE',
        'return' => true
    ]);
    return _REQUEST("GET", $param_name, $options);
}
// show message page
function showMsgPage($options)
{
    extract($options);
    $returnData = arr_val($options, 'return');
    if ($returnData) {
        ob_start();
        include _DIR_ . "components/msg.php";
        $contents = ob_get_contents();
        ob_get_clean();
        return $contents;
    }
    require(_DIR_ . "components/msg.php");

    $exit = arr_val($options, 'exit', true);
    if ($exit)
        die();
}
// Error Msg Page
function errorMsgPage($msg = "Error Please Try Again!", $options = [])
{
    $options['exit'] = true;
    $options['msg'] = $msg;
    $options['type'] = 'error';
    showMsgPage($options);
}
// success Msg Page
function successMsgPage($msg, $options = [])
{
    $options['exit'] = true;
    $options['msg'] = $msg;
    $options['type'] = 'success';
    showMsgPage($options);
}
// Replace \n to <br>
function replaceBreaksToBr($str)
{
    return preg_replace('/(\n)/mi', "<br>", $str);
}
// Merge url or paths
function merge_path(...$paths)
{
    $url = '';
    foreach ($paths as $path) {
        $path = trim($path);
        $path = trim($path, '/');
        if (strlen($path))
            $url .= "/$path";
    }
    $url = trim($url, '/');
    return $url;
}
// Genere Random Name
function getRandom($length = 5)
{
    $random_str = "";
    $codeAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $codeAlphabet .= "abcdefghijklmnopqrstuvwxyz";
    $codeAlphabet .= "0123456789";
    $max = strlen($codeAlphabet);

    for ($i = 0; $i < $length; $i++) {
        $random_str .= $codeAlphabet[random_int(0, $max - 1)];
    }

    return $random_str;
}
/* 
Generate random file name
@param $ext                 -> String - Extension of the file
@param $folder_dir                 -> String - Directory where you want to create the file so it will check the duplicate file bug
@param $return_full_path    -> Boolean - If $folder_dir @param provided then it will return full path
$param $length              -> Number - Length of file name

EXAMPLE:
    generate_file_name('png', './uploads/', true, 10);

    RESPONSE = 3sdc8zsad8.png
*/
function generate_file_name($ext, $folder_dir = '', $return_full_path = false, $length = 5)
{
    $file_name = getRandom($length);
    if ($ext)
        $file_name .= '.' . $ext;
    if ($folder_dir === '') return $file_name;
    $file_location = $folder_dir . $file_name;
    if (file_exists($file_location)) {
        return generate_file_name($ext, $folder_dir);
    } else {
        if ($return_full_path) return $file_location;
        return $file_name;
    }
}
#region File Functions
$s3config = [
    'region'  => 'us-east-2',
    'version' => 'latest',
    'credentials' => [
        'key'    => 'KEY_HERE', //Put key here
        'secret' => 'SECRET_KEY_HERE' // Put Secret here
    ]
];

$bucket = "S3_BUCKET_PATH_HERE";

//s3 data upload 
function uploadS3($file, $name)
{
    global $bucket, $s3config;
    /* $s3 = new S3Client($s3config);
    try {
        $result = $s3->putObject([
            'Bucket' => $bucket,
            'Key'    => $name,
            'SourceFile' => $file,
            'ACL'   => 'public-read'
        ]);
        return $result['ObjectURL'];
    } catch (S3Exception  $e) {
        print_r($e);
    } */
}
/* 
Get Info of file name
@param $file_name -> name of the file

EXAMPLE:
    get_file_info('test.png')

    RESPONSE = [
        'name' => 'test',
        'ext' => 'png'
    ]
*/
function get_file_info($file_name)
{
    $file = [];
    $getExt = explode('.', $file_name);
    $file['ext'] = strtolower(end($getExt));
    array_pop($getExt);
    if (count($getExt) > 0) {
        $file['name'] = implode('.', $getExt);
    } else {
        $file['name'] = $file['ext'];
        $file['ext'] = '';
    }
    return $file;
}
#endregion File Functions
function _404()
{
    require_once _DIR_ . "404.php";
    exit;
}

// rtrim with whole word
function _rtrim($str, $word)
{
    $str = preg_replace('/(' . $word . ')$/', '', $str);
    return $str;
}
// Delet file
function unlink_($filename)
{
    if (file_exists($filename))
        unlink($filename);
}
// Global CSS Files
function global_file($filename)
{
    $filename = rtrim($filename, '.php') . ".php";
    return _DIR_ . "components/global/" . $filename;
}

// CSS & JS file
function assets_file($file, $type, $attach_path = null)
{
    if (is_array($file)) {
        // Multiple files
        foreach ($file as $single_file) {
            assets_file($single_file, $type, $attach_path);
        }
        return true;
    }
    // Single file
    if (
        !strstr($file, 'http') &&
        !strstr($file, '//') &&
        !strstr($file, './')
    ) {
        $file = _rtrim($file, ".$type") . ".$type";
        $file .= ASSETS_V;
        $attach_path = is_null($attach_path) ? '' : $attach_path;
        $file = merge_path($attach_path, $file);
    }
    if ($type === 'css') {
        echo "
        <link rel='stylesheet' href='$file'>";
    } elseif ($type === 'js') {
        echo "
            <script src='$file'></script>";
    }
}
// return main site url
function url(...$paths)
{
    if (count($paths) === 1) {
        if (strpos($paths[0], 'http') === 0)
            return $paths[0];
    }
    $url = SITE_URL;
    foreach ($paths as $path) {
        $url = merge_path($url, $path);
    }
    return $url;
}

#endregion File Functions

function array_val($array, $value, $default = false)
{
    return isset($array[$value]) ? $array[$value] : $default;
}


// Change Dir
function reset_dir()
{
    chdir(CURRENT_DIR);
}
// Change Ext
function change_ext($file_name = '', $ext = '')
{
    return get_file_info($file_name)['name'] . ".$ext";
}



// Delete From array by value
function unset_val(&$array, ...$values)
{
    foreach ($values as $value) {
        $key = array_search($value, $array);
        if ($key !== false) {
            unset($array[$key]);
        }
    }
}
// Scan dir
function scandir_($dir, $attach_path = '')
{
    if (!is_dir($dir)) {
        return [];
    }
    $files = scandir($dir);
    unset_val($files, '.', '..');
    $_files = [];
    foreach ($files as $key => $file) {
        $_files[] = merge_path($attach_path, $file);
    }
    return $_files;
}
