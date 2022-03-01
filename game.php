<?php 
$theme = $_GET['t'];
$unusable_tiles = array(43, 44, 53, 54, 47, 48, 57, 58);
$team = 'blue';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <title>Document</title>
</head>
<body id="fullboard">

    <div id="board"></div>

<p>Current theme: <?=$theme?></p>

<script>
    const placePawns = () => {
        // Delete old images
        $("#board div")
            .children()
            .remove();
        
        // Place pawns
        pawns.forEach(pawn => {
            $("div[data-x='" + pawn[0] + "'][data-y='" + pawn[1] + "']")
                .prepend('<img src="./themes/<?=$theme?>/' + pawn[3] + '/' + pawn[2] + '.png" />')
                .click(function() {
                    movePawn(pawn[0], pawn[1], pawn[2], pawn[3]);
                });
        })
    }
</script>
<script src="js/stratego.js"></script>
    
</body>
</html>