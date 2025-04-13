let currentStep = 0;
const responses = {};

const questions = [
    { id: "HighBP", label: "Do you have high blood pressure? (0=No, 1=Yes)", type: "select", options: ["0", "1"] },
    { id: "HighChol", label: "Do you have high cholesterol? (0=No, 1=Yes)", type: "select", options: ["0", "1"] },
    { id: "CholCheck", label: "Have you had your cholesterol checked recently? (0=No, 1=Yes)", type: "select", options: ["0", "1"] },
    { id: "BMI", label: "What is your BMI?", type: "number", min: 10, max: 100 },
    { id: "Smoker", label: "Are you a smoker? (0=No, 1=Yes)", type: "select", options: ["0", "1"] },
    { id: "Stroke", label: "Have you ever had a stroke? (0=No, 1=Yes)", type: "select", options: ["0", "1"] },
    { id: "Diabetes", label: "Do you have diabetes? (0=No, 1=Yes)", type: "select", options: ["0", "1"] },
    { id: "PhysActivity", label: "Do you engage in regular physical activity? (0=No, 1=Yes)", type: "select", options: ["0", "1"] },
    { id: "Fruits", label: "Do you eat fruits daily? (0=No, 1=Yes)", type: "select", options: ["0", "1"] },
    { id: "Veggies", label: "Do you eat vegetables daily? (0=No, 1=Yes)", type: "select", options: ["0", "1"] },
    { id: "HvyAlcoholConsump", label: "Do you consume heavy amounts of alcohol? (0=No, 1=Yes)", type: "select", options: ["0", "1"] },
    { id: "NoDocbcCost", label: "Have you skipped doctor visits due to cost? (0=No, 1=Yes)", type: "select", options: ["0", "1"] },
    { id: "GenHlth", label: "How would you rate your general health? (1=Excellent, 5=Poor)", type: "select", options: ["1", "2", "3", "4", "5"] },
    { id: "DiffWalk", label: "Do you have difficulty walking? (0=No, 1=Yes)", type: "select", options: ["0", "1"] },
    { id: "Sex", label: "What is your sex? (0=Female, 1=Male)", type: "select", options: ["0", "1"] },
    { id: "Age", label: "What is your age (in years)?", type: "number", min: 18, max: 120 },
    { id: "Education", label: "What is your education level? (1=None, 6=College Grad)", type: "select", options: ["1", "2", "3", "4", "5", "6"] }
];

function renderQuestion(step) {
    const question = questions[step];
    document.getElementById('question-label').textContent = question.label;
    const inputContainer = document.getElementById('input-container');
    inputContainer.innerHTML = '';

    const nextBtn = document.getElementById('next-btn');
    nextBtn.disabled = true; // Start disabled until input is provided

    if (question.type === 'select') {
        const select = document.createElement('select');
        select.name = question.id;
        // Add a blank option first
        const blankOption = document.createElement('option');
        blankOption.value = '';
        blankOption.text = '';
        select.appendChild(blankOption);
        // Add options, showing "No"/"Yes" or numeric values based on question
        question.options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt; // Keep the value as "0", "1", etc.
            if (['HighBP', 'HighChol', 'CholCheck', 'Smoker', 'Stroke', 'Diabetes', 'PhysActivity', 'Fruits', 'Veggies', 'HvyAlcoholConsump', 'NoDocbcCost', 'DiffWalk'].includes(question.id)) {
                option.text = opt === "0" ? "No" : opt === "1" ? "Yes" : opt; // Show "No"/"Yes" for Yes/No questions
            } else if (question.id === 'Sex') {
                option.text = opt === "0" ? "Female" : opt === "1" ? "Male" : opt; // Show "Female"/"Male" for Sex
            } else {
                option.text = opt; // Show numeric values for GenHlth, Education
            }
            select.appendChild(option);
        });
        // Ensure button enables on any change (except blank)
        select.addEventListener('change', () => {
            responses[question.id] = select.value;
            nextBtn.disabled = !select.value; // Enable only if a value is selected (not blank)
        });
        inputContainer.appendChild(select);
    } else if (question.type === 'number') {
        const input = document.createElement('input');
        input.type = 'number';
        input.name = question.id;
        input.min = question.min;
        input.max = question.max;
        input.step = 1;
        input.addEventListener('input', () => {
            responses[question.id] = input.value;
            nextBtn.disabled = !input.value; // Enable only if value is entered
        });
        inputContainer.appendChild(input);
    }

    const progress = ((step + 1) / questions.length) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
}

document.getElementById('next-btn').addEventListener('click', () => {
    if (currentStep < questions.length - 1) {
        currentStep++;
        renderQuestion(currentStep);
    } else {
        fetch('https://your-heart-monitor-backend.herokuapp.com/predict', { // Replace with your Heroku URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(responses)
        })
        .then(response => response.json())
        .then(data => {
            const resultDiv = document.getElementById('result');
            const predictionText = document.getElementById('predictionText');
            if (data.error) {
                predictionText.innerHTML = `Error: ${data.error}`;
            } else {
                const risk = data.prediction === 1 ? "High Risk" : "Low Risk";
                predictionText.innerHTML = `
                    Risk Level: ${risk}<br>
                    Probability: ${(data.probability * 100).toFixed(2)}%
                `;
            }
            document.getElementById('interviewForm').style.display = 'none';
            resultDiv.style.display = 'block';
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('predictionText').innerHTML = 'An error occurred. Please try again.';
            document.getElementById('result').style.display = 'block';
        });
    }
});

// Prevent default form submission and trigger Next button on Enter
document.getElementById('interviewForm').addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent form submission (page reload)
    const nextBtn = document.getElementById('next-btn');
    if (!nextBtn.disabled) {
        nextBtn.click(); // Trigger the Next button's click event
    }
});

// BMI Calculator Logic
document.addEventListener('DOMContentLoaded', () => {
    const heightUnit = document.getElementById('height-unit');
    const weightUnit = document.getElementById('weight-unit');
    const heightMeters = document.getElementById('height-m');
    const heightFeet = document.getElementById('height-ft');
    const heightInches = document.getElementById('height-in');
    const weight = document.getElementById('weight');
    const calculateBtn = document.getElementById('calculate-bmi');
    const bmiResult = document.getElementById('bmi-result');

    function toggleHeightInputs() {
        if (heightUnit.value === 'meters') {
            document.querySelector('.height-meters').style.display = 'flex';
            document.querySelector('.height-feet').style.display = 'none';
        } else {
            document.querySelector('.height-meters').style.display = 'none';
            document.querySelector('.height-feet').style.display = 'flex';
        }
    }

    heightUnit.addEventListener('change', toggleHeightInputs);
    toggleHeightInputs(); // Initial setup

    calculateBtn.addEventListener('click', () => {
        let height, weightValue;
        if (heightUnit.value === 'meters') {
            height = parseFloat(heightMeters.value);
            if (isNaN(height) || height < 0.5 || height > 3) {
                bmiResult.textContent = 'Please enter a valid height (0.5–3 meters)';
                return;
            }
        } else {
            const feet = parseFloat(heightFeet.value);
            const inches = parseFloat(heightInches.value);
            if (isNaN(feet) || isNaN(inches) || feet < 1 || feet > 8 || inches < 0 || inches > 11) {
                bmiResult.textContent = 'Please enter valid feet (1–8) and inches (0–11)';
                return;
            }
            height = (feet * 0.3048) + (inches * 0.0254); // Convert to meters
        }

        if (weightUnit.value === 'kg') {
            weightValue = parseFloat(weight.value);
            if (isNaN(weightValue) || weightValue < 20 || weightValue > 500) {
                bmiResult.textContent = 'Please enter a valid weight (20–500 kg)';
                return;
            }
        } else {
            weightValue = parseFloat(weight.value) * 0.45359237; // Convert lbs to kg
            if (isNaN(weightValue) || weightValue < 20 || weightValue > 500) {
                bmiResult.textContent = 'Please enter a valid weight (20–500 lbs)';
                return;
            }
        }

        const bmi = weightValue / (height * height);
        bmiResult.textContent = `Your BMI: ${bmi.toFixed(1)}`;
        responses['BMI'] = bmi.toFixed(1); // Update interview response with calculated BMI
    });
});

// Start with the first question
renderQuestion(currentStep);