<?php
	header('Access-Control-Allow-Origin: *');
	require_once 'db_connect.php';

	if ($conn) {

		// Used by datainput controller, to populate the dropdown list
		// for adding entries directly via the app
		// with the processes that exists in the database.
		
		$query = $conn->prepare("SELECT * FROM ProcessInfo");
		$query->execute();
		$result = $query->fetchAll(PDO::FETCH_ASSOC);
		echo json_encode($result);
	}
?>