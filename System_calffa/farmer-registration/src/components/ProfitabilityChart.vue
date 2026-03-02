<template>
  <div class="profitability-chart-card">
    <div class="chart-header">
      <h3 class="chart-title">Harvest Profitability Forecast (2026–2030)</h3>
      <div class="chart-actions">
        <button class="export-btn" @click="exportPNG">Export PNG</button>
      </div>
    </div>

    <div class="chart-canvas-wrap">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Custom plugin to draw labels on bars and annotate the threshold line
const dualBarLabelPlugin = {
  id: 'dualBarLabelPlugin',
  afterDatasetsDraw(chart) {
    const { ctx, data, scales } = chart;
    ctx.save();

    const threshold = data.datasets[2] && data.datasets[2].data ? data.datasets[2].data[0] : null;

    // Draw labels for Min bars (dataset 0)
    chart.getDatasetMeta(0).data.forEach((bar, index) => {
      const val = data.datasets[0].data[index];
      const x = bar.x;
      const y = bar.y;

      ctx.fillStyle = '#23341f';
      ctx.font = '500 10px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${val}`, x, y - 6);
    });

    // Draw labels for Max bars (dataset 1)
    chart.getDatasetMeta(1).data.forEach((bar, index) => {
      const val = data.datasets[1].data[index];
      const x = bar.x;
      const y = bar.y;

      ctx.fillStyle = '#23341f';
      ctx.font = '500 10px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${val}`, x, y - 6);
    });

    // Draw threshold label
    if (threshold !== null) {
      const yPos = scales.y.getPixelForValue(threshold);
      ctx.fillStyle = 'rgba(101,67,33,0.9)';
      ctx.font = '600 12px Inter, Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Profitability Threshold (${threshold} kg/ha)`, 8, yPos - 6);
    }

    ctx.restore();
  },
};

Chart.register(dualBarLabelPlugin);

const props = defineProps({
  years: { type: Array, required: true },
  yearlyData: { type: Array, required: true }, // array of {min, max}
  threshold: { type: Number, required: true },
  crop: { type: String, required: false },
});

const canvasRef = ref(null);
let chart = null;

const buildBarColors = (yearlyData, threshold) => {
  // Color logic: if max >= threshold, max is green; if min >= threshold, min is green too
  return yearlyData.map(d => ({
    minColor: d.max >= threshold && d.min >= threshold ? 'rgba(34,139,34,0.85)' : 'rgba(178,34,34,0.85)',
    maxColor: d.max >= threshold ? 'rgba(34,139,34,0.92)' : 'rgba(178,34,34,0.92)',
  }));
};

const createChart = () => {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');

  const colors = buildBarColors(props.yearlyData, props.threshold);
  const minColors = colors.map(c => c.minColor);
  const maxColors = colors.map(c => c.maxColor);

  const minData = props.yearlyData.map(d => d.min);
  const maxData = props.yearlyData.map(d => d.max);

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.years.map(String),
      datasets: [
        {
          label: 'Min Yield',
          data: minData,
          backgroundColor: minColors,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Max Yield',
          data: maxData,
          backgroundColor: maxColors,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          type: 'line',
          label: 'Profitability Threshold',
          data: props.years.map(() => props.threshold),
          borderColor: 'rgba(101,67,33,0.95)',
          borderWidth: 2,
          borderDash: [6, 6],
          fill: false,
          pointRadius: 0,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeOutCubic' },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed.y ?? context.parsed;
              const year = context.label || '';
              const minVal = props.yearlyData[context.dataIndex]?.min || 0;
              const maxVal = props.yearlyData[context.dataIndex]?.max || 0;
              const status = maxVal >= props.threshold ? 'Profitable' : 'Not Profitable';
              return `Year: ${year} – Min: ${minVal} kg/ha – Max: ${maxVal} kg/ha – Status: ${status}`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(200,200,200,0.12)' },
        },
      },
      layout: { padding: { top: 12, right: 12, left: 8, bottom: 8 } },
    },
  });
  chart.options.plugins.dualBarLabelPlugin = true;
};

const updateChart = () => {
  if (!chart) return;
  const colors = buildBarColors(props.yearlyData, props.threshold);
  const minColors = colors.map(c => c.minColor);
  const maxColors = colors.map(c => c.maxColor);
  const minData = props.yearlyData.map(d => d.min);
  const maxData = props.yearlyData.map(d => d.max);

  chart.data.labels = props.years.map(String);
  chart.data.datasets[0].data = minData;
  chart.data.datasets[0].backgroundColor = minColors;
  chart.data.datasets[1].data = maxData;
  chart.data.datasets[1].backgroundColor = maxColors;
  chart.data.datasets[2].data = props.years.map(() => props.threshold);
  chart.update();
};

const exportPNG = () => {
  if (!chart) return;
  const url = chart.toBase64Image();
  const link = document.createElement('a');
  link.href = url;
  link.download = `${props.crop ? props.crop.replace('_', '_') : 'harvest_forecast'}.png`;
  link.click();
};

onMounted(() => createChart());

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy();
    chart = null;
  }
});

watch(
  () => [props.years, props.yearlyData, props.threshold],
  () => updateChart(),
  { deep: true }
);
</script>

<style scoped>
.profitability-chart-card {
  background: linear-gradient(180deg, #f7f3ea, #f6f6f5);
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 8px 20px rgba(34, 49, 33, 0.06);
  border: 1px solid rgba(34, 34, 34, 0.04);
  margin-top: 18px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chart-title {
  font-size: 15px;
  font-weight: 700;
  color: #23492a;
}

.chart-actions .export-btn {
  background: #7c4a2b;
  color: #fff;
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.chart-canvas-wrap {
  width: 100%;
  height: 340px;
}

canvas { width: 100% !important; height: 100% !important; }
</style>
