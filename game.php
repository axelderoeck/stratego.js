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

    <div id="board">
        <?php
        $tile = 1;
        for($y = 1; $y <= 10; $y++){
            for($x = 1; $x <= 10; $x++){
                if (in_array($tile, $unusable_tiles)){
                    echo "<div class='unusable' data-x=$x data-y=$y data-tile=$tile></div>";
                }else{
                    echo "<div data-x=$x data-y=$y data-tile=$tile></div>";
                }
                $tile++;
            }
        } 
        ?>
    </div>

<p>Current theme: <?=$theme?></p>

<script>

    /* Pawns 2D array = [[X, Y, Pawn, Team], ...]
    *
    * @param pawns[ID][0] = X (1-10)
    * @param pawns[ID][1] = Y (1-10)
    * @param pawns[ID][2] = Pawn (0-11) // Flag = 0, Spy = 1, Bomb = 11
    * @param pawns[ID][3] = Team (0/1) // Blue = 0, Red = 1
    * 
    **/

    let pawns = [
        [10, 10, 0, 0],
        [10, 9, 10, 0],
        [9, 10, 10, 0],
        [10, 7, 9, 0],
        [2, 2, 2, 0]
    ];

    const fightPawn = (attacker, defender) => {
        if (attacker < defender){
            if(defender != 1 && attacker == 0) {
                console.log("attacker lose");
            }else if(defender == 8 && attacker == 10){
                console.log("bomb defused");
            }else{
                console.log("attacker win");
            }
        }else if(attacker == defender){
            console.log("both lose");
        }else{
            console.log("attacker lose")
        }
    }

    const addPawn = (x, y, pawn, team) => {
        id = getPawnId(x, y, pawn, team);
        if(id == null){
            pawns.push([x, y, pawn, team]);
            placePawns();
            return true;
        }else{
            console.log("pawn already exists!");
            return false;
        }
    }

    const deletePawn = (x, y, pawn, team) => {
        id = getPawnId(x, y, pawn, team);
        if(id != null){
            pawns.splice(id, 1);
            placePawns();
            return true;
        }else{
            console.log("pawn does not exist.");
            return false;
        }
    }

    const getPawnByCoordinate = (x, y) => {
        found = false;
        for (var i = 0; i < pawns.length; i++) {
            if (pawns[i][0] == x && pawns[i][1] == y){
                found = true;
                break;
            }
        }

        if(found){
            // Return pawn array
            return pawns[i];
        }else{
            return null;
        }
    }

    const getPawnId = (x, y, pawn, team) => {
        found = false;
        // Loop through all pawns
        for (var i = 0; i < pawns.length; i++) {
            if (pawns[i][0] == x && pawns[i][1] == y && pawns[i][2] == pawn && pawns[i][3] == team){
                found = true;
                break;
            }
        }

        if(found){
            // Return pawn ID
            return i;
        }else{
            return null;
        }
    }

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

    const movePawn = (old_x, old_y, pawn, team) => {
        // Add event listener to all tiles
        $('#board div').on("click", function(){
            // Remove event listener click from all tiles
            $('#board div').off('click');

            // Set defaults
            legalMove = false;
            contact = false;

            // Get selected tile
            selectedTile = $(this);
            // Get values from selected tile
            new_x = selectedTile.data("x");
            new_y = selectedTile.data("y");

            // Check for legal move
            if(pawn >= 10){
                legalMove = false;
            }else if(pawn == 9){
                if(new_x != old_x && new_y == old_y){
                    legalMove = true;
                }else if(new_y != old_y && new_x == old_x){
                    legalMove = true;
                }
            }else{
                if((new_x == old_x + 1 || new_x == old_x - 1) && new_y == old_y){
                    legalMove = true;
                }else if((new_y == old_y + 1 || new_y == old_y - 1) && new_x == old_x){
                    legalMove = true;
                }
            }

            // Move the pawn
            if(legalMove){
                console.log("Moved pawn");
                if(contact){
                    console.log("fight");
                }

                // Get pawn ID from array
                pawnId = getPawnId(old_x, old_y, pawn, team);
                // Set new coordinate values to pawn
                pawns[pawnId][0] = new_x;
                pawns[pawnId][1] = new_y;

                // Place pawns
                placePawns();
            }else{
                console.log("Illegal move");
                // Re attach click event
                pawns.forEach(pawn => {
                    $("div[data-x='" + pawn[0] + "'][data-y='" + pawn[1] + "']")
                    .click(function() {
                        movePawn(pawn[0], pawn[1], pawn[2], pawn[3]);
                    });
                })
            }
        });
    }

    const addRandomPawns = () => {
        // In order: 0 (=flag), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 (=bomb)
        let amount_pawns = [1, 1, 8, 5, 4, 4, 4, 3, 2, 1, 1, 6];
        test = 0;
        /* 
        * i = pawn number
        * j = counter pawns
        **/
        for (i = 0; i < amount_pawns.length; i++){
            for(j = 0; j <= amount_pawns[i]; j++){
                randomX = Math.floor(Math.random() * 10) + 1;
                randomY = Math.floor(Math.random() * 10) + 7;

                while (addPawn(randomX, randomY, i, 0) == false) {
                    randomX = Math.floor(Math.random() * 10) + 1;
                    randomY = Math.floor(Math.random() * 10) + 7;
                }
            }
        }
    }

    //addRandomPawns();
    placePawns();

</script>
    
</body>
</html>