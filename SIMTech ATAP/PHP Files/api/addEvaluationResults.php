<?php
	header('Access-Control-Allow-Origin: *');
	require_once 'db_connect.php';

	if ($conn) {

		// This file is used when for saving the evaluation results for a waste item.

		// Get the data that was POSTed. This contains the info to be added.
		$data = json_decode( file_get_contents('php://input') );
		$waste = $data->waste;
		$avoidCauses = $data->avoidableCauses;
		$unavoidCauses = $data->unavoidableCauses;
		$reductionReco = $data->reductionRecommendations;
		$diversionReco = $data->diversionRecommendations;

		try {
			// set the PDO error mode to exception
			$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$conn->beginTransaction(); // transaction so that the old info is delete only if new info added successfully

			// delete the results of the same waste material, if present
			$deleteOld = $conn->prepare("DELETE FROM EvaluationResults WHERE Waste = '" . $waste . "';");
			$deleteOld->execute();

			// for every result string in avoidableCauses array, insert into database
			foreach($avoidCauses as $i => $string) {
				$insertAvoidCause = $conn->prepare("INSERT INTO EvaluationResults VALUES ('"
												   . $waste . "', 'avoidable', '" . $string . "');");
				$insertAvoidCause->execute();
			}

			// for every result string in unavoidableCauses array, insert into database
			foreach($unavoidCauses as $i => $string) {
				$insertUnavoidCause = $conn->prepare("INSERT INTO EvaluationResults VALUES ('"
												     . $waste . "', 'unavoidable', '" . $string . "');");
				$insertUnavoidCause->execute();
			}

			// for every result string in reductionRecommendations array, insert into database
			foreach($reductionReco as $i => $string) {
				$insertReductionReco = $conn->prepare("INSERT INTO EvaluationResults VALUES ('"
												      . $waste . "', 'reduction', '" . $string . "');");
				$insertReductionReco->execute();
			}

			// for every result string in diversionRecommendations array, insert into database
			foreach($diversionReco as $i => $string) {
				$insertDiversionReco = $conn->prepare("INSERT INTO EvaluationResults VALUES ('"
												      . $waste . "', 'diversion', '" . $string . "');");
				$insertDiversionReco->execute();
			}

			$conn->commit(); // commit the transaction
			echo "Evaluation results added into database.";
		} catch(PDOException $e) {
			// roll back the transaction if something failed
			$conn->rollback();
			echo "Error: " . $e->getMessage();
		}
	} else {
		echo "Database connection error.";
	}
?>