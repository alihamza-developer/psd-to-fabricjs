<?php
class Functions
{
    private $db;
    private $file_extensions_mapping = [
        "video/*" => ".webm,.ogm,.ogv,.asx,.mpg,.mp2,.mpeg,.mpe,.mpv,.ogg,.mp4,.m4p,.m4v.avi,.wmv,.mov,.qt,.flv,.swf",
        "image/*" => ".jpg,.jpeg,.png,.gif,.bmp,.tiff,.svg"
    ];
    public function __construct()
    {
        global $db;
        $this->db = $db;
    }

    // Convert to bytes
    function to_bytes(string $from): ?int
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        $number = substr($from, 0, -2);
        $suffix = strtoupper(substr($from, -2));

        //B or no suffix
        if (is_numeric(substr($suffix, 0, 1))) {
            return preg_replace('/[^\d]/', '', $from);
        }

        $exponent = array_flip($units)[$suffix] ?? null;
        if ($exponent === null) {
            return null;
        }

        return $number * (1024 ** $exponent);
    }
    // return msg
    function msg($type, $data, $isJson = false)
    {
        $msg = [
            'status' => $type,
            'data' => $data
        ];
        if ($isJson) $msg = json_encode($msg);
        return $msg;
    }
    // Error msg
    function error($data, $isJson = false)
    {
        return $this->msg('error', $data, $isJson);
    }
    // success msg
    function success($data, $isJson = false)
    {
        return $this->msg('success', $data, $isJson);
    }
    // Sort Multiple files in $_FILES
    function sort_multiple_files($files)
    {
        $total = count($files['name']);
        $output = [];
        for ($i = 0; $i < $total; $i++) {
            $output[] = [
                'name' => $files['name'][$i],
                'type' => $files['type'][$i],
                'tmp_name' => $files['tmp_name'][$i],
                'error' => $files['error'][$i],
                'size' => $files['size'][$i],
            ];
        }
        return $output;
    }
    /**
     * Upload File to server
     * Upload File to S3
     * 
     * @file_param_name - string - parameter name of file - ex: $_FILES[file_param_name]
     * $data - array - Array of options
     *          name_length     ->      Length of filename                  (default 5)
     *          path            ->      upload folder path                  (default current_dir)
     *          upload_to_s3    ->      Boolan                              (default true)
     *          max_size        ->      max file size (in mb, gb)
     *          s3_path         ->      if upload to s3 then s3 dir path    (default @path)
     *          allowed_exts    ->      ['jpg', 'jpeg', 'png', 'gif']
     * 
     * Feel free to improve the function with your mind blowing ideas 😉
     * Thanks
     **/
    function upload_file($file_param_name, $data = [])
    {
        $multiple = arr_val($data, 'multiple', false);
        // Multiple files upload
        if ($multiple) {
            $data['multiple'] = false;
            $output = [];
            $files = $this->sort_multiple_files($_FILES[$file_param_name]);
            foreach ($files as $file) {
                $output[] = $this->upload_file($file, $data);
            }
            return $output;
        }
        // Get File Data
        $file = null;
        if (gettype($file_param_name) === "string") {
            if (!isset($_FILES[$file_param_name])) return $this->error("$file_param_name not found!");
            $file = $_FILES[$file_param_name];
        } else {
            $file = $file_param_name;
        }

        $name_length = arr_val($data, 'name_length', 15);
        $folder_path = arr_val($data, 'path', "");
        $uploadToS3 = arr_val($data, 'upload_to_s3', false);
        $max_size = arr_val($data, 'max_size');
        if ($max_size) {
            $max_size_bytes = $this->to_bytes($max_size);
            if ($file['size'] > $max_size_bytes) return $this->error("max file size is $max_size");
        }
        $original_name = $file['name'];
        $file_info = get_file_info($original_name);
        $file_ext = strtolower($file_info['ext']);
        $filename = generate_file_name($file_info['ext'], $folder_path, false, $name_length);
        $filepath = merge_path($folder_path, $filename);
        // File type
        $allowed_exts = arr_val($data, 'allowed_exts');

        if ($allowed_exts) {
            if (gettype($allowed_exts) === "string") {
                if (count(explode(",", $allowed_exts)) > 1) {
                    $temp_chunks = explode(",", $allowed_exts);
                    for ($i = 0; $i < count($temp_chunks); $i++) {
                        $temp_chunk = trim($temp_chunks[$i]);
                        if (array_key_exists($temp_chunk, $this->file_extensions_mapping)) {
                            $allowed_exts = $this->file_extensions_mapping[$temp_chunk];
                            break;
                        }
                    }
                } else if (array_key_exists($allowed_exts, $this->file_extensions_mapping)) {
                    $allowed_exts = $this->file_extensions_mapping[$allowed_exts];
                }


                $allowed_exts = explode(",", $allowed_exts);
            }
            $is_allowed = false;
            foreach ($allowed_exts as $ext) {
                $ext = ltrim($ext, '.');
                $ext = trim($ext);
                if (strtolower($ext) === strtolower($file_ext))
                    $is_allowed = true;
            }
            if (!$is_allowed) return $this->error("File type is not allowed");
        }
        $uploaded = move_uploaded_file($file['tmp_name'], $filepath);
        if (!$uploaded) return $this->error("Error uploading file!");
        if (!$uploadToS3) {
            return [
                'status' => 'success',
                'filename' => $filename,
                'original_file_name' => $original_name,
                'filepath' => $filepath,
                'size' => $file['size']
            ];
        }
        $file_path = merge_path($folder_path, $filename);
        $s3_folder_path = arr_val($data, 's3_path', $folder_path);
        $s3_file_path = merge_path($s3_folder_path, $filename);
        uploadS3($file_path, $s3_file_path);
        unlink($file_path);
        return [
            'status' => 'success',
            'filename' => $filename,
            'original_file_name' => $original_name,
            'filepath' => $filepath,
            'size' => $file['size']
            // 's3_url' => merge_path(S3_URL, $s3_file_path)
        ];
    }
    // Compare Data
    public function compare($oldData, $newData)
    {
        $changedData = [];
        if (gettype($oldData) === "array") {
            foreach ($newData as $key => $new_value) {
                if (isset($oldData[$key])) {
                    $old_value = $oldData[$key];
                    if ($old_value != $new_value) {
                        $changedData[$key] = [
                            "old" => $old_value,
                            "new" => $new_value
                        ];
                    }
                }
            }
        }
        return $changedData;
    }
    // Compare changes in two arrays
    public function compare_arrays($old_array, $new_array)
    {
        $result = [];

        foreach ($old_array as $item) {
            if (!in_array($item, $new_array)) {
                $result[] = [
                    "status" => "deleted",
                    "item" => $item
                ];
            }
        }

        foreach ($new_array as $item) {
            if (!in_array($item, $old_array)) {
                $result[] = [
                    "status" => "added",
                    "item" => $item
                ];
            }
        }

        return $result;
    }
}

$_fn = new Functions();
