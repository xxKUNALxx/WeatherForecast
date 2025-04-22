import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

def preprocess_data(df):
    # Select the numerical features (exclude the 'Year' column, if not relevant)
    features = df[[
        'Avg_Temperature_degC', 'CO2_Emissions_tons_per_capita',
        'Sea_Level_Rise_mm', 'Rainfall_mm', 'Population',
        'Renewable_Energy_pct', 'Extreme_Weather_Events', 'Forest_Area_pct'
    ]]

    # Handle missing values (impute with mean)
    imputer = SimpleImputer(strategy='mean')
    # Scale the features
    scaler = StandardScaler()

    # Impute and scale the features
    X_clean = scaler.fit_transform(imputer.fit_transform(features))
    
    # Return preprocessed features for unsupervised tasks
    return pd.DataFrame(X_clean, columns=features.columns)

