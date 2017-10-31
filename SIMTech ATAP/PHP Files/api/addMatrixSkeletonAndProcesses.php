<?php
	header('Access-Control-Allow-Origin: *');
	require_once 'db_connect.php';

	if ($conn) {

		// This file is used when the user uploads a spreadsheet to
		// initialise or update the matrix skeleton and processes information.

		// Get the data that was POSTed. This contains the info to be added.
		$data = json_decode( file_get_contents('php://input') );

		try {
			// set the PDO error mode to exception
			$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$conn->beginTransaction(); // transaction so that the old info is delete only if new info added successfully

			// delete the old skeleton
			$deleteOldMatrix = $conn->prepare("DELETE FROM MatrixSkeleton;");
			$deleteOldMatrix->execute();

			// delete the old process info
			$deleteOldProcessInfo = $conn->prepare("DELETE FROM ProcessInfo;");
			$deleteOldProcessInfo->execute();

			$processArray = $data->processInfo; // array containing processes & their components
			foreach($processArray as $i => $process) { // for every process object in the POSTed array
				$processName = $process->process;
				$componentsArray = $process->components;
				foreach($componentsArray as $c => $componentInfo) {
					$componentName = $componentInfo->component;
					$role = $componentInfo->role;
					// add into db
					$insertProcess = $conn->prepare("INSERT INTO ProcessInfo VALUES (:process, :component, :role);");
					$insertProcess->execute(array(
						"process" => $processName,
						"component" => $componentName,
						"role" => $role
					));			
				}
			}

			$matrixSkeletonArray = $data->matrixCells; // array containing cells of matrix skeleton
			foreach($matrixSkeletonArray as $j => $cell) { // for every cell value in the POSTed array
				$row = $cell->row;
				$column = $cell->column;
				$value = $cell->value;
				// add into db
				$insertCell = $conn->prepare("INSERT INTO MatrixSkeleton VALUES (:row, :column, :value);");
				$insertCell->execute(array(
					"row" => $row,
					"column" => $column,
					"value" => $value
				));
			}

			// Delete all previously stored evaluation results, to keep in sync with the new waste items.
			$deleteEvaluations = $conn->prepare("DELETE FROM EvaluationResults;");
			$deleteEvaluations->execute();

			$conn->commit(); // commit the transaction
			echo "Process info and matrix skeleton added.";
		} catch(PDOException $e) {
			// roll back the transaction if something failed
			$conn->rollback();
			echo "Error: " . $e->getMessage();
		}
	} else {
		echo "Database connection error.";
	}
?>