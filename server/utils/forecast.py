from prophet import Prophet
import pandas as pd

def forecast_temperature(df):
    # Only perform forecasting if the relevant columns exist
    if 'Year' in df.columns and 'Avg_Temperature_degC' in df.columns:
        yearly = df.groupby('Year')['Avg_Temperature_degC'].mean().reset_index()
        yearly['ds'] = pd.to_datetime(yearly['Year'].astype(str))
        yearly.rename(columns={'Avg_Temperature_degC': 'y'}, inplace=True)

        model = Prophet()
        model.fit(yearly[['ds', 'y']])

        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)

        return forecast[['ds', 'yhat']]  # Returning forecasted values
    return None
