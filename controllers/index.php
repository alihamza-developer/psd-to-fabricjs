<?php
define('DIR', '../');
require_once "../includes/db.php";
// psdToCanvas
if (isset($_POST['psdToCanvas'])) {

    $file = $_fn->upload_file("file", [
        'path' => TMP_DIR
    ]);
    $folder_path = generate_file_name(false, TMP_DIR, true);

    @mkdir($folder_path);

    if ($file['status'] !== 'success') returnError('File not uploaded');


    $res = $ext->execute('node::psd-to-canvas', [
        'filepath' => merge_path(_DIR_, $file['filepath']),
        'folderpath' => merge_path(_DIR_, $folder_path)
    ]);
    $data = json_decode($res, true);

    $width = $data['width'];
    $height = $data['height'];
    $data = $data['data'];


    returnSuccess([
        'file' => $file,
        'width' => $width,
        'height' => $height,
        'data' => $data,
    ]);
}
