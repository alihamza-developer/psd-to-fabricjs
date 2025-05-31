<?php

class Extension
{
    private $path = 'extensions';
    private $extensions = [];
    private $main_dir;

    public function __construct($path = '')
    {
        $this->main_dir = _DIR_;

        if (strlen($path) > 0) {
            $this->path = $path;
        }

        $this->path = merge_path($this->main_dir, $this->path);
    }

    private function get_temp_folder_path()
    {
        $temp_path = merge_path($this->path, 'temp');
        if (!is_dir($temp_path)) {
            mkdir($temp_path);
        }
        return $temp_path;
    }

    public function get_all_languages()
    {
        $langauges = [];
        foreach ($this->extensions as $langauge_name => $extensions) {
            $langauges[] = $langauge_name;
        }
        return $langauges;
    }

    public function get_all_extensions($langauge_name)
    {
        return $this->extensions[$langauge_name];
    }

    private function is_language_exists($langauge_name)
    {
        return isset($this->extensions[$langauge_name]);
    }

    private function is_extension_exists($langauge_name, $extension_name)
    {
        return isset($this->extensions[$langauge_name][$extension_name]);
    }

    public function register_extension($langauge, $extension_name, $data)
    {
        $filename = array_val($data, 'filename');
        $command = array_val($data, 'command');

        if (!$filename) {
            throw new Error("Parameter 'filename' is required");
        }

        if (!$command) {
            throw new Error("Parameter 'command' is required");
        }

        $langauge_dir = merge_path($this->path, $langauge);

        if (!$this->is_language_exists($langauge)) {
            if (!is_dir($langauge_dir)) {
                throw new Error("'$langauge' directory does'nt exist");
            } else {
                $this->extensions[$langauge] = [];
            }
        }

        if ($this->is_extension_exists($langauge, $extension_name)) {
            throw new Error(
                "Extension '$extension_name' already exists in language '$langauge'"
            );
        }

        if (!file_exists(merge_path($langauge_dir, $filename))) {
            throw new Error("File '$filename' not found");
        } else {
            $file_info = get_file_info($filename);

            $this->extensions[$langauge][$extension_name] = [
                'filename' => $filename,
                'file_ext' => $file_info['ext'],
                'command' => $command,
            ];
            return "$langauge::$extension_name";
        }
    }

    public function execute($extension_name, $variables, $delete_file = true, $options = [])
    {
        list($langauge_name, $extension_name) = explode('::', $extension_name);

        if (!$this->is_language_exists($langauge_name)) {
            throw new Error("Language '$langauge_name' not found");
        }

        if (!$this->is_extension_exists($langauge_name, $extension_name)) {
            throw new Error(
                "Extension '$extension_name' not found in language '$langauge_name'"
            );
        }

        $extension_data = $this->extensions[$langauge_name][$extension_name];

        $target_filepath = merge_path(
            $this->path,
            $langauge_name,
            $extension_data['filename']
        );

        $filecode = file_get_contents($target_filepath);

        $temp_folder_path = $this->get_temp_folder_path();

        $temp_filename = generate_file_name(
            $extension_data['file_ext'],
            $temp_folder_path
        );
        $temp_file_path = merge_path($temp_folder_path, $temp_filename);

        fopen($temp_file_path, 'w');

        foreach ($variables as $key => $value) {
            $filecode = str_replace('_{{' . $key . '}}_', $value, $filecode);
        }

        file_put_contents($temp_file_path, $filecode);

        $get_code = array_val($options, 'get_code', false);
        if ($get_code) {
            return $filecode;
        }

        $command = str_replace(
            '_{{filename}}_',
            $temp_filename,
            $extension_data['command']
        );

        if (ENV != 'local') {
            $command = str_replace('python', 'python3', $command);
        }

        $current_dir = getcwd();

        chdir($temp_folder_path);

        $response = shell_exec($command . ' 2>&1');

        chdir($current_dir);
        if ($delete_file) {
            unlink($temp_file_path);
        }
        return $response;
    }
}

$ext = new Extension();

// Register extensions here

$ext->register_extension('node', 'psd-to-canvas', [
    'filename' => 'psd-to-canvas.js',
    'command' => 'node _{{filename}}_',
]);
