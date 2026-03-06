import { useMemo } from "react";
import {
  Card,
  CardTitle,
  CardBody,
  Grid,
  GridItem,
} from "@patternfly/react-core";
import {
  Chart,
  ChartArea,
  ChartAxis,
  ChartGroup,
  ChartVoronoiContainer,
} from "@patternfly/react-charts/victory";
import PaneBody from "../../../common/PaneBody";
import { DeploymentKind } from "./DeploymenDetails";

type DeploymentMetricsProps = {
  obj: DeploymentKind;
};

interface DataPoint {
  x: number;
  y: number;
}

const POINTS = 12;
const INTERVAL = 10; // minutes between points

function buildTimeSeries(baseValue: number, variance: number): DataPoint[] {
  return Array.from({ length: POINTS }, (_, i) => ({
    x: (POINTS - i) * INTERVAL,
    y: Math.max(0, baseValue * (1 - variance + Math.random() * variance * 2)),
  }));
}

const TICK_VALUES = [120, 90, 60, 30];

const MetricChart = ({
  title,
  data,
  unit,
  color,
}: {
  title: string;
  data: DataPoint[];
  unit: string;
  color: string;
}) => (
  <Card isPlain>
    <CardTitle>{title}</CardTitle>
    <CardBody>
      <div style={{ height: 250 }}>
        <Chart
          ariaTitle={title}
          containerComponent={
            <ChartVoronoiContainer
              labels={({ datum }: { datum: { y: number } }) =>
                `${datum.y.toFixed(2)} ${unit}`
              }
            />
          }
          height={250}
          padding={{ bottom: 40, left: 60, right: 20, top: 10 }}
        >
          <ChartAxis
            tickValues={TICK_VALUES}
            tickFormat={(t: number) => `${t}m`}
          />
          <ChartAxis dependentAxis showGrid label={unit} />
          <ChartGroup>
            <ChartArea
              data={data}
              name={title}
              style={{
                data: { fill: color, fillOpacity: 0.3, stroke: color },
              }}
            />
          </ChartGroup>
        </Chart>
      </div>
    </CardBody>
  </Card>
);

const DeploymentMetrics = ({ obj: deployment }: DeploymentMetricsProps) => {
  const replicas = deployment.spec?.replicas ?? 1;

  const charts = useMemo(
    () => ({
      memory: buildTimeSeries(128 * replicas, 0.3),
      cpu: buildTimeSeries(0.25 * replicas, 0.4),
      filesystem: buildTimeSeries(50 * replicas, 0.15),
      network: buildTimeSeries(2.5 * replicas, 0.5),
    }),
    [replicas],
  );

  return (
    <PaneBody>
      <Grid hasGutter>
        <GridItem md={6}>
          <MetricChart
            title="Memory Usage"
            data={charts.memory}
            unit="MiB"
            color="#0066CC"
          />
        </GridItem>
        <GridItem md={6}>
          <MetricChart
            title="CPU Usage"
            data={charts.cpu}
            unit="cores"
            color="#3E8635"
          />
        </GridItem>
        <GridItem md={6}>
          <MetricChart
            title="Filesystem"
            data={charts.filesystem}
            unit="MiB"
            color="#F0AB00"
          />
        </GridItem>
        <GridItem md={6}>
          <MetricChart
            title="Network In"
            data={charts.network}
            unit="MBps"
            color="#A30000"
          />
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export default DeploymentMetrics;
