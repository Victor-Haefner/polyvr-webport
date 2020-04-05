<?php
$dir = $_GET['path'];
$content = scandir($dir);
$num = count($content);
$files = array();
$dirs = array();
for ($i = 2; $i < $num; $i++) {
	if (is_file("$dir/$content[$i]")) $files[] = $content[$i];
	else $dirs[] = $content[$i];
}
echo implode( "|", $dirs );
echo "|||";
echo implode( "|", $files );
?>
