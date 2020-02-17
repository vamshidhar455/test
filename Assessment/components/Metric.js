import React from "react";
import MetricCard from './MetricCard';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';

const query = gql`
  query($metricName: String!) {
    getLastKnownMeasurement(metricName: $metricName) {
      at
      metric
      value
      unit
    }
  }
`;

function Metric ({ metricName}) {
  const { loading, error, data } = useQuery(
    query,
    {
      variables: { metricName },
      pollInterval: 1300
    },
  );

  if (loading) return null;
  if (error) return `Error! ${error}`;

  return (
    <MetricCard metricInfo={data.getLastKnownMeasurement} />
  );
};

export default Metric;
