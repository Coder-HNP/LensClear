import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

/**
 * Returns the common options for the LiveChart.
 * @returns {Object} Chart.js options object
 */
export const getChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
        legend: {
            position: 'top',
            labels: {
                usePointStyle: true,
                boxWidth: 8,
                font: {
                    family: "'Inter', sans-serif",
                    size: 12
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#1e293b',
            bodyColor: '#475569',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 10,
            displayColors: true,
            usePointStyle: true,
        }
    },
    scales: {
        x: {
            grid: {
                display: false,
            },
            ticks: {
                font: {
                    family: "'Inter', sans-serif",
                    size: 11
                },
                color: '#94a3b8'
            }
        },
        y: {
            grid: {
                color: '#f1f5f9',
                borderDash: [5, 5]
            },
            ticks: {
                font: {
                    family: "'Inter', sans-serif",
                    size: 11
                },
                color: '#94a3b8'
            },
            beginAtZero: false
        }
    }
});

/**
 * Formats raw sensor data from Firestore for the chart.
 * @param {Array} historyData - Array of history objects from Firestore
 * @returns {Object} Data object compatible with Chart.js
 */
export const formatSensorDataForChart = (historyData) => {
    if (!Array.isArray(historyData)) return { labels: [], datasets: [] };

    // Sort by timestamp ascending
    const sortedData = [...historyData].sort((a, b) =>
        (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
    );

    const labels = sortedData.map(d => {
        if (!d.timestamp) return '';
        const date = d.timestamp.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    const temperatures = sortedData.map(d => d.temperature || 0);
    const humidity = sortedData.map(d => d.humidity || 0);

    return {
        labels,
        datasets: [
            {
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: '#0077D1',
                backgroundColor: '#0077D120',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Humidity (%)',
                data: humidity,
                borderColor: '#6BCB6B',
                backgroundColor: '#6BCB6B20',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                tension: 0.4,
                fill: true,
            }
        ]
    };
};

/**
 * Appends a new data point to existing chart series (helper for real-time updates without full re-render if needed).
 * @param {Object} currentData - Current Chart.js data object
 * @param {Object} newDataPoint - New data point { timestamp, temperature, humidity }
 * @returns {Object} Updated Chart.js data object
 */
export const appendPointToSeries = (currentData, newDataPoint) => {
    const newLabels = [...currentData.labels];
    const newDatasets = currentData.datasets.map(ds => ({ ...ds, data: [...ds.data] }));

    const date = newDataPoint.timestamp.toDate ? newDataPoint.timestamp.toDate() : new Date(newDataPoint.timestamp);
    const label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    newLabels.push(label);
    if (newLabels.length > 20) newLabels.shift(); // Keep last 20 points

    // Dataset 0: Temperature
    newDatasets[0].data.push(newDataPoint.temperature);
    if (newDatasets[0].data.length > 20) newDatasets[0].data.shift();

    // Dataset 1: Humidity
    newDatasets[1].data.push(newDataPoint.humidity);
    if (newDatasets[1].data.length > 20) newDatasets[1].data.shift();

    return {
        labels: newLabels,
        datasets: newDatasets
    };
};
