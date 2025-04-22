import sys
import os
import pandas as pd
import joblib
from fpdf import FPDF
import matplotlib.pyplot as plt
import seaborn as sns
from prophet import Prophet
from sklearn.metrics import classification_report
from utils.preprocess import preprocess_data
from utils.visualization import plot_trend, plot_risk_distribution

# Load the models
kmeans = joblib.load("server/models/kmeans_model.pkl")
iso = joblib.load("server/models/isolation_model.pkl")

# Load the data
file_path = sys.argv[1]
df = pd.read_csv(file_path)

# Ensure necessary columns are present
required_columns = {
    'Year', 'Country', 'Avg_Temperature_degC', 'CO2_Emissions_tons_per_capita',
    'Sea_Level_Rise_mm', 'Rainfall_mm', 'Population',
    'Renewable_Energy_pct', 'Extreme_Weather_Events',
    'Forest_Area_pct'
}

if not required_columns.issubset(df.columns):
    raise ValueError(f"Missing required columns. Required: {required_columns}")

# Prepare features for unsupervised learning
features = df.select_dtypes(include='number').drop(columns=['Year'], errors='ignore')

# Apply K-Means clustering
df['Cluster'] = kmeans.predict(features)

# Anomaly detection using Isolation Forest
df['Anomaly'] = iso.predict(features)  # -1 for anomaly, 1 for normal

# Visualizations for clustering and anomaly detection
plt.figure(figsize=(8, 6))
sns.countplot(x='Cluster', data=df)
plt.title("K-Means Cluster Distribution")
plt.savefig("server/output/cluster_distribution.png")

plt.figure(figsize=(8, 6))
sns.scatterplot(x='Avg_Temperature_degC', y='CO2_Emissions_tons_per_capita', hue='Anomaly', data=df)
plt.title("Anomaly Detection (Red = Outliers)")
plt.savefig("server/output/anomaly_scatter.png")

# Trend forecasting using Prophet (Temperature)
forecast_df = None
if 'Avg_Temperature_degC' in df.columns:
    # Prepare the data for Prophet (temperature forecasting)
    temp_df = df[['Year', 'Avg_Temperature_degC']].dropna()
    temp_df = temp_df.rename(columns={'Year': 'ds', 'Avg_Temperature_degC': 'y'})

    # Initialize Prophet model
    model = Prophet()
    model.fit(temp_df)

    # Create future dataframe for forecasting
    future = model.make_future_dataframe(temp_df, periods=365)
    forecast = model.predict(future)

    # Save forecast to CSV
    forecast_df = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    forecast_df.to_csv("server/output/temperature_forecast.csv", index=False)

    # Plot the forecast
    model.plot(forecast)
    plt.title("Temperature Forecast")
    plt.savefig("server/output/temperature_forecast_plot.png")

# PDF Generation for the report
pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)
pdf.cell(200, 10, "Climate Analysis Report", ln=1)
pdf.cell(200, 10, "Clustering, Anomaly Detection, and Trend Forecasting", ln=1)
pdf.ln(5)

pdf.multi_cell(200, 10, "Conclusion:\nThis report provides an analysis of climate data, including K-Means clustering to group similar regions, anomaly detection to identify unusual patterns, and trend forecasting for temperature over time. Insights include cluster distribution, outliers, and future temperature trends.")
pdf.ln(5)

# Include insights from the clustering and anomaly detection
cluster_report = df['Cluster'].value_counts().to_string()
anomaly_report = df['Anomaly'].value_counts().to_string()

pdf.multi_cell(200, 10, f"Cluster Summary:\n{cluster_report}")
pdf.ln(5)
pdf.multi_cell(200, 10, f"Anomaly Summary:\n{anomaly_report}")
pdf.ln(5)

# Include the forecast
if forecast_df is not None:
    forecast_summary = forecast_df.head().to_string()
    pdf.multi_cell(200, 10, f"Temperature Forecast (first 5 rows):\n{forecast_summary}")
    pdf.ln(5)

# Save the report PDF
os.makedirs("server/output", exist_ok=True)
pdf.output("server/output/climate_analysis_report.pdf")

# Save images to the output directory
pdf.image("server/output/cluster_distribution.png", x=10, y=110, w=180)
pdf.image("server/output/anomaly_scatter.png", x=10, y=200, w=180)
pdf.image("server/output/temperature_forecast_plot.png", x=10, y=290, w=180)

print("✅ Report generated and saved successfully.")
