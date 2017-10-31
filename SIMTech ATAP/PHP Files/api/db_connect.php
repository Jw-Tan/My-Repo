<?php

    // This file contains the database details and creates a connection to it.
    // All other PHP files only need to include the following line:
    // require_once 'db_connect.php';
    // and they will be able to use $conn for querying the database.
    // This removes the need for replicating the details and
    // makes it easier to update when the database information has to be changed.

    $server = "simtechpomslm.cx3glme2lznt.ap-southeast-1.rds.amazonaws.com,1433";
    $database = "FLW_APP";
    $username = "simtechpomslm";
    $password = "simtechpomslm1234";

    // TO DO: do a try catch or die?
    $conn = new PDO("sqlsrv:Server={$server};Database={$database}", $username, $password);
?>