<?php
	header('Access-Control-Allow-Origin: *');
	require_once 'db_connect.php';

	if ($conn) {

		// Used to get the entries of waste evaluation results, if any.
		
		$query = $conn->prepare("SELECT * FROM EvaluationResults;");
		$query->execute();
		$result = $query->fetchAll(PDO::FETCH_ASSOC);
		echo json_encode($result);
	}
?>