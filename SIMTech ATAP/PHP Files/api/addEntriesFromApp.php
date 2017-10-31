<?php
	header('Access-Control-Allow-Origin: *');
	require_once 'db_connect.php';

	if ($conn) {

		// This file is used when user adds entries directly through the app form.

		// Get the data that was POSTed. This contains the entries to be added.
		$array = json_decode( file_get_contents('php://input'), true );

		$data = $conn->query("SELECT MAX(ID) AS ID FROM BreadTalkData")->fetchAll(PDO::FETCH_ASSOC);
		$currentID = $data[0]["ID"];
		if (is_null($currentID)) {
			// no data entered yet, start from 1
			$ID = 1;
		} else {
			// use the current max ID, incremented by 1
			$ID = (int)$currentID + 1;
		}

		try {
			// set the PDO error mode to exception
			$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$conn->beginTransaction(); // in a transaction, if any entry insertion fails, none will be committed

			foreach($array as $i => $entry) { // for every object in the passed array

				$insert = $conn->prepare("INSERT INTO BreadTalkData VALUES (
										 :id, :year, :month, :day, :inOutWaste,
										 :process, :material, :amount, :remarks, :uploaded)");		
				$insert->execute(array(
					"id" => $ID,
					"year" => (int)$entry['year'],
					"month" => (int)$entry['month'],
					"day" => (int)$entry['day'],
					"inOutWaste" => $entry['iow'],
					"process" => $entry['process'],
					"material" => $entry['material'],
					"amount" => (float)$entry['amount'],
					"remarks" => $entry['remarks'],
					"uploaded" => -1 // -1 instead of timestamp to indicate submission via app
				));
				$ID++; // increment ID for the next entry
			}
			$conn->commit(); // commit the transaction
			echo "New records created successfully";
		} catch(PDOException $e) {
			// roll back the transaction if something failed
			$conn->rollback();
			echo "Error: " . $e->getMessage();
		}
	} else {
		echo "Database connection error.";
	}
?>