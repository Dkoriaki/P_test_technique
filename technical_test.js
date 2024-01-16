// Function for loan calculations
function p(t, d) {
	return ((t/12)/(1-(Math.pow( 1+t/12, -d))));
};


// Function to calculate the monthly payment for a loan.
function calculateMonthlyPayment(amount, interestRate, duration) {
	return (amount * (p(interestRate, duration)));
};


// Function to calculate the interest paid over the loan duration.
function calculateInterest(monthlyPayment, amount, duration) {
	return (monthlyPayment * duration - amount)
}


// Function to calculate the smooth monthly payment for a combination of short-term and long-term loans.
function calculateSmoothMonthlyPayment(amount1, interestRate1, duration1, amount2, interestRate2, duration2) {
	return ((amount2+(calculateMonthlyPayment(amount1, interestRate1, duration1)/p(interestRate2, duration1)))*p(interestRate2, duration2));
}


/**
 * Function to find the maximum borrowing ratio for the short-term loan.
 * Assumes the maximum is reached when long-term loan payments only cover interest.
 * 
 * @param {number} interestRate1 - Short-term loan interest rate.
 * @param {number} duration1 - Short-term loan duration in months.
 * @param {number} interestRate2 - Long-term loan interest rate.
 * @param {number} duration2 - Long-term loan duration in months.
 * @returns {number} Maximum borrowing ratio for the short-term loan.
 */
function ratio(interestRate1, duration1, interestRate2, duration2) {
	// Check if any of the essential parameters (interest rates and durations) is empty or undefined
	if (!interestRate1 || !duration1 || !interestRate2 || !duration2) {
		console.error("The provided parameters are not valid.");
		return undefined;
	}

	const totalAmount = 100; // 100% of the borrowed amount
	const precision = 0.0001; // Number of decimal places for calculation accuracy

	let amount1 = 0 + precision; // short-term loan amount borrowed
	let amount2 = totalAmount - precision; // long-term loan amount borrowed

	let smoothMonthlyPayment; // Amount of smooth loan monthly payments
	let shortMonthlyPayment; // Amount of short-term loan monthly payments during period 1
	let longMonthlyPayment; // Amount of long-term loan monthly payments during period 1

	let smoothInterest; // Amount of interest for the smooth loan
	let shortInterest; // Amount of interest for the short-term loan
	let longInterest; // Amount of interest for the long-term loan

	let minLongMonthlyPayment; // Minimum amount to pay to cover the long loan interest

	let bestShortAmount = 0; // Best short-term loan amount
	let bestMonthlyPayment = 0; // Best monthly payment

	while (amount2 > precision)
	{
		smoothMonthlyPayment = calculateSmoothMonthlyPayment(amount1, interestRate1, duration1, amount2, interestRate2, duration2);
		shortMonthlyPayment = calculateMonthlyPayment(amount1, interestRate1, duration1);
		longMonthlyPayment = smoothMonthlyPayment - shortMonthlyPayment;

		smoothInterest = calculateInterest(smoothMonthlyPayment, totalAmount, duration2);
		shortInterest = calculateInterest(shortMonthlyPayment, amount1, duration1);
		longInterest = smoothInterest - shortInterest;

		minLongMonthlyPayment = longInterest / duration1;

		if (longMonthlyPayment >= minLongMonthlyPayment)
		{
			if (bestMonthlyPayment === 0 || longMonthlyPayment < bestMonthlyPayment)
			{
				bestMonthlyPayment = longMonthlyPayment;
				bestShortAmount = amount1;		
			}
		}
		amount1 += precision;
		amount2 -= precision;
	}
	return (bestShortAmount);
}


/**
 * Function to find the lowest interest combination of loans based on a given loan.
 * 
 * @param {number[]} givenLoan - An array representing the given loan, [interestRate, duration] in years.
 * @param {number[][]} otherLoans - An array of arrays representing other loans, [[interestRate, duration], ...] in years.
 * @returns {Object} An object containing the best combination of loans with the lowest interest:
 *  - ratio: The borrowing ratio of the best combination.
 *  - interest: The lowest interest found.
 *  - loan: The best combination of loans, [interestRate, duration] in years.
 */
function findLowestInterestCombination(givenLoan, otherLoans) {
	// Check if any of the parameters is empty, undefined, or not a valid array
	if (!givenLoan || (!givenLoan[0] || !givenLoan[1]) || givenLoan.length !== 2 || !otherLoans || otherLoans.length === 0) {
		console.error("The provided parameters are not valid.");
		return undefined;
	}

	let bestCombination;
	let currentRatio;
	let bestRatio;
	let bestInterest;
	let currentInterest;
	let smoothMonthlyPayment;
	let result = {
		ratio: undefined,
		interest: undefined,
		loan: undefined,
	};

	// Convert loan durations to months for the given loan
	const givenLoanDuration = givenLoan[0] * 12;

	// Find the best combination of loans with the lowest interest.
	for (let i = 0; i < otherLoans.length; i++) {
		// Check and convert durations for each loan in the loop
		if (otherLoans[i] && otherLoans[i].length === 2 && otherLoans[i][0] && otherLoans[i][1]) {
			otherLoans[i][0] *= 12;
		}
		else {
			console.warn("The parameters of a loan in otherLoans are not valid. This loan will be ignored.");
			continue; // Ignore this loan and move to the next one
		}

		currentRatio = ratio(otherLoans[i][1], otherLoans[i][0], givenLoan[1], givenLoanDuration);
		smoothMonthlyPayment = calculateSmoothMonthlyPayment(currentRatio, otherLoans[i][1], otherLoans[i][0], 100-currentRatio, givenLoan[1], givenLoanDuration);
		currentInterest = calculateInterest(smoothMonthlyPayment, 100, givenLoanDuration);

		if (currentInterest < bestInterest || bestInterest === undefined)
		{
			bestInterest = currentInterest;
			bestCombination = otherLoans[i];
			bestRatio = currentRatio;
		}
	};

	// Converts months back to years for the best loan combination.
	bestCombination[0] /= 12;

	result.ratio = bestRatio;
	result.interest = bestInterest;
	result.loan = bestCombination;

	if (result.ratio === 0) {
		console.error("There are no possible combinations.")
		return undefined;
	}

	return(result);
}






// Tests for findLowestInterestCombination()

let combination1 = [[10, 0.029], [12, 0.032],[15, 0.035], [20, 0.038], [22, 0.038], [25, 0.044]];

let combination2 = [[19, 0.022], [20, 0.023], [22, 0.028], [24, 0.031]];

let combination3 = [[10, 0.029], [12, 0.032],[15, 0.035], [20, 0.038], [22, 0.038], [25, 0.044]];

let combination4 = [[1, 0.022]];

let failingCombination1 = [[, 0.029], [12, 0.032],[15, 0.035], [20, 0.038], [22, 0.038], [25, 0.044]];

let failingCombination2 = [];

let givenLoan = [25, 0.044];

console.log(`From "combination1" Best combination for this given loan ${givenLoan} is :`);
console.log(findLowestInterestCombination(givenLoan, combination1));

console.log("\n----------------------------------\n");

console.log(`From "combination2" Best combination for this given loan ${givenLoan} is :`);
console.log(findLowestInterestCombination(givenLoan, combination2));

console.log("\n----------------------------------\n");

console.log(`From "combination4" Best combination for this given loan ${givenLoan} is :`);
console.log(findLowestInterestCombination(givenLoan, combination4));

console.log("\n----------------------------------\n");

console.log(`From "failingCombination1" Best combination for this given loan ${givenLoan} is :`);
console.log(findLowestInterestCombination(givenLoan, failingCombination1));

console.log("\n----------------------------------\n");

console.log(`From "failingCombination2" Best combination for this given loan ${givenLoan} is :`);
console.log(findLowestInterestCombination(givenLoan, failingCombination2));

console.log("\n----------------------------------\n");

console.log(`Wrong given Loan :`);
console.log(findLowestInterestCombination([], combination3));

console.log("\n----------------------------------\n");


// Simple test to find the best loan amount from the example in Notion
console.log("RATIO\n- Simple test from the example in Notion [0.0115, 180] & [0.018, 300]")
console.log(`In this case, the better ratio for the short-term amount is : ${ratio(0.0115, 180, 0.018, 300)}`);



