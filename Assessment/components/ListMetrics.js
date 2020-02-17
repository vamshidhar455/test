import React from 'react';
import Metric from './Metric';
import { useSelector } from "react-redux";
import { Provider, createClient } from "urql";

const client = createClient({
  url: "https://react.eogresources.com/graphql"
});

const getSelectedMetrics = state => {
  const {metric} = state;
  return metric.selected_metrics;
}

export default () => {
  return (
    <Provider value={client}>
      <ListMetrics />
    </Provider>
  )
}

const ListMetrics = () => {
  const selected_metrics = useSelector(getSelectedMetrics);

  if (selected_metrics.length === 0) {
    return (
      <h3>Please select metrics to view</h3>
    )
  }
  return (
      <div>
        {
          selected_metrics.map((metric, i) => {
            return (
              <Metric key={i} metricName={metric} />
            )
          })
        }
      </div>
  )
}

