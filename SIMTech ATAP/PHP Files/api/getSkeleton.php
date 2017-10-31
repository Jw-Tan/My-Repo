<?php
	header('Access-Control-Allow-Origin: *');
	require_once 'db_connect.php';

	if ($conn) {

		// This file is used by normalisation controller to retrieve and build 
		// the matrix skeleton.

		$getMaxRow = $conn->prepare("SELECT MAX(Row) AS Count FROM MatrixSkeleton;");
		$getMaxRow->execute();
		$maxRowResult = $getMaxRow->fetchAll(PDO::FETCH_ASSOC);
		$rowCount = $maxRowResult[0]["Count"];

		$getSkeleton = $conn->prepare("SELECT * FROM MatrixSkeleton;");
		$getSkeleton->execute();
		$skeletonResult = $getSkeleton->fetchAll(PDO::FETCH_ASSOC);

		$result = array(
			// largest index in database, i.e. index of last row
			"rowCount" => $rowCount,
			"skeleton" => json_encode($skeletonResult)
		);
		echo json_encode($result);
	}
?>