<?php
	header('Access-Control-Allow-Origin: *');
	require_once 'db_connect.php';

	if ($conn) {

		// This file is used by hospot controller & normalisation controller.
		// Fetches and returns unique year & month combinations.

		$monthQuery = $conn->prepare("SELECT DISTINCT Year, Month FROM BreadTalkData;");	
		$monthQuery->execute();
		$result = array();
		$result['months'] = $monthQuery->fetchAll(PDO::FETCH_ASSOC);
		echo json_encode($result);
	}
?>