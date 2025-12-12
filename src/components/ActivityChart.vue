<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

const props = defineProps({
  type: {
    type: String,
    default: 'bar',
    validator: (value) => ['bar', 'pie', 'line', 'doughnut'].includes(value)
  },
  data: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    default: () => ({})
  }
});

const chartCanvas = ref(null);
let chartInstance = null;

// Default colors for charts
const defaultColors = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#009688', // Teal
];

// Initialize chart
const initChart = () => {
  if (!chartCanvas.value) return;

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = chartCanvas.value.getContext('2d');
  
  // Prepare chart data based on type
  const chartData = prepareChartData();
  
  // Merge default options with custom options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== undefined) {
              label += context.parsed.y + (props.type === 'bar' ? ' aktivitas' : ' jam');
            } else {
              label += context.parsed;
            }
            return label;
          }
        }
      }
    },
    ...props.options
  };

  // Create chart
  chartInstance = new Chart(ctx, {
    type: props.type,
    data: chartData,
    options: chartOptions
  });
};

// Prepare chart data based on type
const prepareChartData = () => {
  const { type, data } = props;
  
  if (type === 'pie' || type === 'doughnut') {
    return {
      labels: data.labels || [],
      datasets: [{
        data: data.values || [],
        backgroundColor: data.colors || defaultColors.slice(0, data.labels?.length),
        borderWidth: 1,
        borderColor: '#fff'
      }]
    };
  } else if (type === 'bar' || type === 'line') {
    return {
      labels: data.labels || [],
      datasets: data.datasets?.map((dataset, index) => ({
        ...dataset,
        backgroundColor: dataset.backgroundColor || defaultColors[index % defaultColors.length],
        borderColor: dataset.borderColor || defaultColors[index % defaultColors.length],
        borderWidth: 2,
        fill: type === 'line'
      })) || []
    };
  }
  
  return { labels: [], datasets: [] };
};

// Watch for data changes
watch(() => props.data, () => {
  if (chartInstance) {
    const newData = prepareChartData();
    chartInstance.data = newData;
    chartInstance.update();
  }
}, { deep: true });

// Watch for type changes
watch(() => props.type, () => {
  initChart();
});

// Lifecycle hooks
onMounted(() => {
  initChart();
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

@media (min-width: 768px) {
  .chart-container {
    height: 400px;
  }
}
</style>