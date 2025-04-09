import React, { useEffect, useState } from 'react';

const LazyPieChart: React.FC<{ data: any; options?: any }> = ({ data, options }) => {
  const [ChartComponent, setChartComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const [{ Pie }, ChartJS] = await Promise.all([
        import('react-chartjs-2'),
        import('chart.js'),
      ]);

      ChartJS.Chart.register(
        ChartJS.ArcElement,
        ChartJS.Tooltip,
        ChartJS.Legend,
        ChartJS.CategoryScale,
        ChartJS.LinearScale,
        ChartJS.BarElement,
        ChartJS.Title
      );

      if (isMounted) {
        setChartComponent(() => Pie);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!ChartComponent) {
    return <div>Loading chart...</div>;
  }

  return <ChartComponent data={data} options={options} />;
};

export default LazyPieChart;