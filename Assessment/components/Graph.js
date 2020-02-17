import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Provider, createClient } from 'urql';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import * as actions from '../store/actions';
import Chart from "react-apexcharts";

const WITHIN_TIMESTAMP = 30;

const client = createClient({
  url: "https://react.eogresources.com/graphql"
});

const heartBeatQuery = gql`
  {
    heartBeat
  }
`;

const dataQuery = gql`
  query($input: [MeasurementQuery!]!) {
    getMultipleMeasurements(input: $input) {
      metric
      measurements {
        at
        metric
        value
        unit
      }
    }
  }
`;

const getSelectedMetrics = state => {
  const { metric } = state;
  return metric.selected_metrics;
}

export default () => {
  return (
    <Provider value={client}>
      <Graph />
    </Provider>
  )
}


const Graph = () => {
  const dispatch = useDispatch();
  const selected_metrics = useSelector(getSelectedMetrics);

  const heartBeat = useQuery(
    heartBeatQuery,
    { pollInterval: 1300 }
  )

  useEffect(() => {
    if (heartBeat.error) {
      dispatch({ type: actions.API_ERROR, error: heartBeat.error.message });
      return;
    }
  }, [dispatch, heartBeat.data, heartBeat.error]);


  var input = [];
  input = selected_metrics.map(metricName => ({
    metricName: metricName,
    after: new Date(heartBeat.data.heartBeat - WITHIN_TIMESTAMP*60000).getTime()
  }))

  const metricsData = useQuery(
    dataQuery,
    {
      variables: { input },
    }
  )

  useEffect(
    () => {
      if (metricsData.error) {
        dispatch({ type: actions.API_ERROR, error: metricsData.error.message });
        return;
      }
      if (!metricsData.data) return;
      const { getMultipleMeasurements } = metricsData.data;
      dispatch({ type: actions.METRIC_DATA_RECEIVED, getMultipleMeasurements });
    },
    [dispatch, metricsData.data, metricsData.error]
  );
  
  const data = metricsData.data.getMultipleMeasurements;
  if (typeof data === 'undefined' || data === 0) {
    return null;
  }

  var chartData = [];
  var yAxisConfig = [];
  var metric_unitSet = new Set();
  
  data.forEach(metricData => {
    var datapoints = [];
    var measures = metricData.measurements;
    measures.forEach(record => {
      var pair = [record.at, record.value];
      datapoints.push(pair);
      if (!metric_unitSet.has(record.unit)) {
        metric_unitSet.add(record.unit);
        yAxisConfig.push({
          seriesName: record.unit === 'F' ? 'Temp' : (record.unit === 'PSI' ? 'Pressure' : 'injValveOpen'),
          title: {
            text: record.unit === 'F' ? 'Temp' : (record.unit === 'PSI' ? 'Pressure' : 'injValveOpen')
          },
          axisBorder: {
            show: true
          },
          axisTicks: {
            show: true,
          }
        })
      }
    })

    chartData.push({
      name: metricData.metric,
      data: datapoints
    })
  })


  if (selected_metrics.length === 0) {
    return null;
  }

  return (
    <div>
      <Chart 
        options={{
          chart: {
            stacked: false,
            zoom: {
              type: 'x',
              enabled: true
            },
            toolbar: {
              autoSelected: 'zoom'
            }
          },
          plotOptions: {
            line: {
              curve: 'smooth',
            }
          },
          dataLabels: {
            enabled: false
          },

          markers: {
            size: 0,
            style: 'full',
          },
          title: {
            text: 'Metric measurements',
            align: 'left'
          },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              inverseColors: false,
              opacityFrom: 0.5,
              opacityTo: 0,
              stops: [0, 90, 100]
            },
          },
          yaxis: yAxisConfig.length !== 0 ? yAxisConfig : {
            title: {
              text: 'Value'
            },
            axisBorder: {
              show: true
            },
            axisTicks: {
              show: true,
            }
          },
          xaxis: {
            type: 'datetime',
          },
        }}
        series={
          chartData
        }
        type="area"
        height="350"
        width="800"
      />

    </div>
  )
}