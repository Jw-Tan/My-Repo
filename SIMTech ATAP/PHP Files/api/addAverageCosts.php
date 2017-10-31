<?php
	header('Access-Control-Allow-Origin: *');
	require_once 'db_connect.php';

	if ($conn) {

		// This file is used by initilisation to store the average costs
		// of producing 1kg of product & disposal of 1kg of waste.

		// Get the data that was POSTed.
		$data = json_decode( file_get_contents('php://input'), true );
		$productionCost = $data["productionCost"];
		$disposalCost = $data["disposalCost"];

		try {
			// set the PDO error mode to exception
			$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$conn->beginTransaction(); // in a transaction, if any query fails, none will be committed

			// Delete the old values first.
			$delete = $conn->prepare("DELETE FROM AverageProductionAndDisposalCosts;");
			$delete->execute();

			$insertCosts = $conn->prepare("INSERT INTO AverageProductionAndDisposalCosts VALUES (" . $productionCost
									. ", " . $disposalCost . ");"); 
			$insertCosts->execute();
			$conn->commit(); // commit the transaction
			echo "Costs updated successfully";
		} catch(PDOException $e) {
			// roll back the transaction if something failed
			$conn->rollback();
			echo "Error: " . $e->getMessage();
		}
	} else {
		echo "Database connection error.";
	}
?>