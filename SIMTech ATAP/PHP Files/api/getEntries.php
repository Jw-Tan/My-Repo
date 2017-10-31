<?php
	header('Access-Control-Allow-Origin: *');
	require_once 'db_connect.php';

	if ($conn) {

		// This file is used by hotspot service & normalisation controller to get the data entries.
		$timeFrame = $_GET['timeFrame'];
		$year = $_GET['year'];
		$month = $_GET['month'];

		// Columns that are not necessary (such as ID, dates, etc) are excluded from retrieval.
		// If a certain timeframe is specified, the query is appended accordingly.
		// Summation of the amounts is handled by SQL for simplification.
		$queryString = "SELECT InOutWaste, Process, Material, SUM(Amount) AS Amount FROM BreadTalkData";
		if ($timeFrame == 'By Year') {
			$queryString .= ' WHERE Year = ' . $year;
		} else if ($timeFrame == 'By Month') {
			$split = explode(" ", $month);
			$queryString .= ' WHERE Year = ' . $split[1] . ' AND Month = ' . $split[0];
		}
		$queryString .= " GROUP BY InOutWaste, Process, Material;";

		$query = $conn->prepare($queryString);
		$query->execute();
		$result = $query->fetchAll(PDO::FETCH_ASSOC);
		echo json_encode($result);
	}
?>