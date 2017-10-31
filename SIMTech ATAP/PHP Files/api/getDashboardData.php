<?php
	header('Access-Control-Allow-Origin: *');
	require_once 'db_connect.php';

	if ($conn) {

		// This file is used for providing the dashboard with the necessary data.

		// Get the data that was POSTed.
		$data = json_decode( file_get_contents('php://input'), true );

		// This query fetches the number of data entries rows.
		// Used by dashboard to prompt user to add data. 
		$entryCountQueryString = "SELECT COUNT(*) AS Count FROM BreadTalkData;";
		$entryCountQuery = $conn->prepare($entryCountQueryString);
		$entryCountQuery->execute();
		$entryCountResult = $entryCountQuery->fetchAll(PDO::FETCH_ASSOC);

		// This query fetches the number of rows regarding the matrix skeleton.
		// Used by dashboard to prompt user to initialise it. 
		$skeletonCountQueryString = "SELECT COUNT(*) AS Count FROM MatrixSkeleton;";
		$skeletonCountQuery = $conn->prepare($skeletonCountQueryString);
		$skeletonCountQuery->execute();
		$skeletonCountResult = $skeletonCountQuery->fetchAll(PDO::FETCH_ASSOC);

		// This query fetches the number of rows regarding process information.
		// Used by dashboard to prompt user to initlialise it. 
		$processInfoCountQueryString = "SELECT COUNT(*) AS Count FROM ProcessInfo;";
		$processInfoCountQuery = $conn->prepare($processInfoCountQueryString);
		$processInfoCountQuery->execute();
		$processInfoCountResult = $processInfoCountQuery->fetchAll(PDO::FETCH_ASSOC);
	
		// This query fetches waste data for the current week, if any.
		// Dates for the current week are provided in the POSTed data.
		// Only relevant columns are fetched, and the amount is summed via SQL.
		// Note that if a particular day has no data, nothing is returned for that day.
		// The fetched rows are sorted according to date in ascending order.
		$weekQueryString = "SELECT Year, Month, Day, SUM(AMOUNT) AS Waste FROM BreadTalkData" 
						   . " WHERE InOutWaste = 'Waste' AND (";
		$weekArray = $data["weekDates"];
		for($i = 0; $i < count($weekArray); $i++) {
			if ($i > 0) { 
				$weekQueryString .= " OR ";
			}
			$weekQueryString .= "(Year = " . $weekArray[$i]["year"] 
								. " AND Month = " . $weekArray[$i]["month"]
								. " AND Day = " . $weekArray[$i]["day"] . ")";
		}
		$weekQueryString .= ") GROUP BY Year, Month, Day ORDER BY Year, Month, Day;";
		$weekQuery = $conn->prepare($weekQueryString);
		$weekQuery->execute();
		$weekResult = $weekQuery->fetchAll(PDO::FETCH_ASSOC);

		$year = $data["year"]; // this year
		$month = $data["month"]; // this month

		// This query fetches waste data for each month of the year that was POSTed.
		// Only relevant columns are fetched, and the amount is summed via SQL.
		// Note that if a particular month has no data, nothing is returned for that month.
		// The fetched rows are sorted according to month in ascending order.
		$monthQueryString = "SELECT Year, Month, SUM(Amount) AS Waste FROM BreadTalkData"
						    . " WHERE InOutWaste = 'Waste' AND Year = " . $year
						    . " GROUP BY Year, Month"
						    . " ORDER BY Month;";
		$monthQuery = $conn->prepare($monthQueryString);
		$monthQuery->execute();
		$monthResult = $monthQuery->fetchAll(PDO::FETCH_ASSOC);

		// This query fetches waste data for each year from in the database.
		// Note that if a particular year has no data, nothing is returned for that year.
		// The fetched rows are sorted according to year in ascending order.
		$yearQueryString = "SELECT Year, SUM(Amount) AS Waste FROM BreadTalkData"
						   . " WHERE InOutWaste = 'Waste'"
						   . " GROUP BY Year"
						   . " ORDER BY Year;";
		$yearQuery = $conn->prepare($yearQueryString);
		$yearQuery->execute();
		$yearResult = $yearQuery->fetchAll(PDO::FETCH_ASSOC);

		$today = $data["today"];

		// This query fetches process data for today.
		// It is used for top 3 inefficient processes in daily view.
		$todayProcessesQueryString = "SELECT Process, InOutWaste, SUM(Amount) AS Amount FROM BreadTalkData"
										 . " WHERE Year = " . $year
										 . " AND Month = " . $month
										 . " AND Day = " . $today
										 . " GROUP BY InOutWaste, Process;";
		$todayProcessesQuery = $conn->prepare($todayProcessesQueryString);
		$todayProcessesQuery->execute();
		$todayProcessResult = $todayProcessesQuery->fetchAll(PDO::FETCH_ASSOC);

		// This query fetches process data for this month.
		// It is used for top 3 inefficient processes in month view.
		$monthProcessesQueryString = "SELECT Process, InOutWaste, SUM(Amount) AS Amount FROM BreadTalkData"
									. " WHERE Year = " . $year
									. " AND Month = " . $month
									. " GROUP BY InOutWaste, Process;";
		$monthProcessesQuery = $conn->prepare($monthProcessesQueryString);
		$monthProcessesQuery->execute();
		$monthProcessesResult = $monthProcessesQuery->fetchAll(PDO::FETCH_ASSOC);

		// This query fetches process data for this year.
		// It is used for top 3 inefficient processes in year view.
		$yearProcessesQueryString = "SELECT Process, InOutWaste, SUM(Amount) AS Amount FROM BreadTalkData"
									. " WHERE Year = " . $year
									. " GROUP BY InOutWaste, Process;";
		$yearProcessesQuery = $conn->prepare($yearProcessesQueryString);
		$yearProcessesQuery->execute();
		$yearProcessesResult = $yearProcessesQuery->fetchAll(PDO::FETCH_ASSOC);

		// This query fetches the average costs for producing & disposing 1 kg of waste,
		// if the user has already initialised it.
		$averageCostsQuery = $conn->prepare("SELECT * FROM AverageProductionAndDisposalCosts;");	
		$averageCostsQuery->execute();
		$averageCostsResult = $averageCostsQuery->fetchAll(PDO::FETCH_ASSOC);
		
		$result = array(
			"entryCount" => json_encode($entryCountResult),
			"skeletonCount" => json_encode($skeletonCountResult),
			"processInfoCount" => json_encode($processInfoCountResult),
			"weekView" => json_encode($weekResult),
			"monthView" => json_encode($monthResult),
			"yearView" => json_encode($yearResult),
			"todayProcesses" => json_encode($todayProcessResult),
			"monthProcesses" => json_encode($monthProcessesResult),
			"yearProcesses" => json_encode($yearProcessesResult),
			"averageCosts" => json_encode($averageCostsResult)
		);
		echo json_encode($result);
	} else {
		echo "Database connection error.";
	}
?>