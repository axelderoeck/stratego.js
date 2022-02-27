<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>

<p>Themes</p>
<ul>
<?php
$themes = scandir('themes');
foreach($themes as $theme){
    if($theme != "." && $theme != ".." && !is_file("themes/$theme")){
        echo "<li>" . $theme . "</li>";
        echo "<a href='game.php?t=$theme'>" . $theme . "</a>";
    }
}
?>
</ul>
    
</body>
</html>