import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib  # For saving the model
import numpy as np

# Load dataset
file_path = "heart_disease_health_indicators_BRFSS2015.csv"  # Ensure the correct path
df = pd.read_csv(file_path)

# Define features and target variable
X = df.drop(columns=["HeartDiseaseorAttack"])  # Assuming "HeartDiseaseorAttack" is the target column
y = df["HeartDiseaseorAttack"]

# Split the dataset into training and testing sets (stratified sampling for balance)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Adjust class weighting to fine-tune recall and precision balance
class_weight = {0: 1, 1: 3}  # Adjusted weight for better precision-recall balance

# Hyperparameter tuning with class weighting
param_grid = {
    'n_estimators': [100, 200, 300],
    'learning_rate': [0.01, 0.05, 0.1],
    'max_depth': [3, 5, 7]
}

grid_search = GridSearchCV(GradientBoostingClassifier(random_state=42), param_grid, cv=3, scoring='recall', n_jobs=-1)
grid_search.fit(X_train, y_train, sample_weight=y_train.map(class_weight))

# Best model from grid search
best_model = grid_search.best_estimator_

# Save the trained model
joblib.dump(best_model, "heart_disease_model.pkl")
print("Model saved as 'heart_disease_model.pkl'")

# Get predicted probabilities
y_probs = best_model.predict_proba(X_test)[:, 1]

# Adjust decision threshold
def adjust_threshold(probs, threshold=0.4):
    return (probs >= threshold).astype(int)

y_pred_best = adjust_threshold(y_probs, threshold=0.4)

# Evaluation metrics
best_accuracy = accuracy_score(y_test, y_pred_best)
best_classification_rep = classification_report(y_test, y_pred_best)
best_conf_matrix = confusion_matrix(y_test, y_pred_best)

# Display results
print("Best Model:", best_model)
print("Accuracy:", best_accuracy)
print("Classification Report:\n", best_classification_rep)
print("Confusion Matrix:\n", best_conf_matrix)
