<?php
	header('Access-Control-Allow-Origin: *');
	require_once 'db_connect.php';

	if ($conn) {

		// This file is used when the user uploads entries via spreadsheet
		// while choosing to replace the previous data uploaded via spreadsheet.
		// Only the entries that were added in the latest upload are deleted,
		// second-to-last uploads are unaffected, and entries added directly
		// via the app are unaffected as well.

		// Get the data that was POSTed. This contains the entries to be added.
		$array = json_decode( file_get_contents('php://input'), true );	
		$timestamp = (int)date("U"); // use the seconds since the Unix Epoch as upload timestamp

		try {
			// set the PDO error mode to exception
			$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$conn->beginTransaction(); // in a transaction, if any entry insertion fails, none will be committed

			// Get the largest timestamp value. Entries with this value were uploaded in the last batch.
			$result = $conn->query("SELECT MAX(Uploaded) AS Last FROM BreadTalkData;")->fetchAll(PDO::FETCH_ASSOC);
			$lastUploadedTimestamp = $result[0]["Last"];
			if (!is_null($lastUploadedTimestamp) && $lastUploadedTimestamp != -1) {
				// If there exists data, delete all entries having this timestamp value
				// Entries with timestamp value of -1 are entries uploaded through the app,
				// current implementation is to not overwrite them.
				$conn->query("DELETE FROM BreadTalkData WHERE Uploaded = " . $lastUploadedTimestamp);
			}

			$data = $conn->query("SELECT MAX(ID) AS ID FROM BreadTalkData")->fetchAll(PDO::FETCH_ASSOC);
			$currentID = $data[0]["ID"];
			if (is_null($currentID)) {
				// no data entered yet, start from 1
				$ID = 1;
			} else {
				// use the current max ID, incremented by 1
				$ID = (int)$currentID + 1;
			}

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
					"uploaded" => $timestamp
				));
				$ID++; // increment ID for the next entry
			}
			$conn->commit(); // commit the transaction
			echo "The last-uploaded records were deleted, and the new records were created successfully";
		} catch(PDOException $e) {
			// roll back the transaction if something failed
			$conn->rollback();
			echo "Error: " . $e->getMessage();
		}
	} else {
		echo "Database connection error.";
	}
?>